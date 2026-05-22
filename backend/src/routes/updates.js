const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// GET /updates
router.get('/updates', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const connections = await prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
      },
    });

    const connectionUserIds = connections.map(c =>
      c.requesterId === currentUserId ? c.receiverId : c.requesterId
    );

    if (connectionUserIds.length === 0) {
      return res.json({ data: [] });
    }

    const reviews = await prisma.review.findMany({
      where: { userId: { in: connectionUserIds } },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        course: { select: { id: true, title: true, provider: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
