const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// GET /users/me
router.get('/me', authenticate, (req, res) => {
  const { id, email, name, avatarUrl, role, linkedinConnected, linkedinProfileUrl } = req.user;
  res.json({ id, email, name, avatarUrl, role, linkedinConnected, linkedinProfileUrl });
});

// PATCH /users/me
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'name is required.' } });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    });

    const { id, email, avatarUrl, role, linkedinConnected, linkedinProfileUrl } = updated;
    res.json({ id, email, name: updated.name, avatarUrl, role, linkedinConnected, linkedinProfileUrl });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
