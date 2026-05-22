const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// GET /discover/courses/:courseId
router.get('/discover/courses/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const currentUserId = req.user.id;

    const verifiedEnrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'VERIFIED', NOT: { userId: currentUserId } },
      select: { userId: true },
    });
    const verifiedUserIds = verifiedEnrollments.map(e => e.userId);

    const [users, existingConnections] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: verifiedUserIds } },
        select: { id: true, name: true, avatarUrl: true },
      }),
      prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: currentUserId, receiverId: { in: verifiedUserIds } },
            { receiverId: currentUserId, requesterId: { in: verifiedUserIds } },
          ],
        },
      }),
    ]);

    const connectionMap = {};
    for (const c of existingConnections) {
      const otherId = c.requesterId === currentUserId ? c.receiverId : c.requesterId;
      connectionMap[otherId] = c.status.toLowerCase();
    }

    const data = users
      .filter(u => connectionMap[u.id] !== 'accepted')
      .map(u => ({
        ...u,
        connectionStatus: connectionMap[u.id] || 'none',
      }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /connections/sent
router.get('/connections/sent', authenticate, async (req, res) => {
  try {
    const sent = await prisma.connection.findMany({
      where: { requesterId: req.user.id, status: 'PENDING' },
      include: { receiver: { select: { id: true, name: true, avatarUrl: true } } },
    });
    res.json({ data: sent.map(c => ({ id: c.id, receiver: c.receiver, createdAt: c.createdAt })) });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /connections
router.post('/connections', authenticate, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'receiverId is required.' } });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({ error: { code: 'SELF_CONNECTION', message: 'You cannot connect with yourself.' } });
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, receiverId },
          { requesterId: receiverId, receiverId: req.user.id },
        ],
      },
    });
    if (existing) {
      return res.status(409).json({ error: { code: 'CONNECTION_ALREADY_EXISTS', message: 'Connection already exists.' } });
    }

    const connection = await prisma.connection.create({
      data: { requesterId: req.user.id, receiverId, status: 'PENDING' },
    });

    res.status(201).json(connection);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /connections
router.get('/connections', authenticate, async (req, res) => {
  try {
    const connections = await prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
      },
      include: { requester: { select: { id: true, name: true, avatarUrl: true } }, receiver: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const data = connections.map(c => {
      const user = c.requesterId === req.user.id ? c.receiver : c.requester;
      return { id: c.id, user, connectedSince: c.createdAt };
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /connections/requests
router.get('/connections/requests', authenticate, async (req, res) => {
  try {
    const requests = await prisma.connection.findMany({
      where: { receiverId: req.user.id, status: 'PENDING' },
      include: { requester: { select: { id: true, name: true, avatarUrl: true } } },
    });

    res.json({
      data: requests.map(r => ({
        id: r.id,
        requester: r.requester,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// PATCH /connections/:id
router.patch('/connections/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'status must be ACCEPTED or REJECTED.' } });
    }

    const connection = await prisma.connection.findUnique({ where: { id: req.params.id } });
    if (!connection || connection.receiverId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Connection not found or access denied.' } });
    }

    const updated = await prisma.connection.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// DELETE /connections/:id
router.delete('/connections/:id', authenticate, async (req, res) => {
  try {
    const conn = await prisma.connection.findUnique({ where: { id: req.params.id } });
    if (!conn) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Connection not found.' } });
    if (conn.requesterId !== req.user.id && conn.receiverId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized.' } });
    }
    await prisma.connection.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
