const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// GET /users/search?q=
router.get('/search', authenticate, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ data: [] });
  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user.id } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, name: true, avatarUrl: true,
        sentConnections:     { where: { receiverId:  req.user.id }, select: { id: true, status: true } },
        receivedConnections: { where: { requesterId: req.user.id }, select: { id: true, status: true } },
      },
      take: 20,
    });
    const data = users.map(u => {
      const incoming = u.sentConnections[0];
      const outgoing = u.receivedConnections[0];
      let connStatus = 'NONE', connId = null;
      if (outgoing) { connStatus = outgoing.status; connId = outgoing.id; }
      else if (incoming) { connStatus = incoming.status === 'ACCEPTED' ? 'ACCEPTED' : 'INCOMING'; connId = incoming.id; }
      return { id: u.id, name: u.name, avatarUrl: u.avatarUrl, connStatus, connId };
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /users/me
router.get('/me', authenticate, (req, res) => {
  const { id, email, name, avatarUrl, role, linkedinConnected, linkedinProfileUrl } = req.user;
  res.json({ id, email, name, avatarUrl, role, linkedinConnected, linkedinProfileUrl });
});

// PATCH /users/me
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, linkedinProfileUrl } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'name is required.' } });
    }

    const data = { name };
    if (linkedinProfileUrl !== undefined) {
      data.linkedinProfileUrl = linkedinProfileUrl || null;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    const { id, email, avatarUrl, role, linkedinConnected, linkedinProfileUrl: lip } = updated;
    res.json({ id, email, name: updated.name, avatarUrl, role, linkedinConnected, linkedinProfileUrl: lip });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
