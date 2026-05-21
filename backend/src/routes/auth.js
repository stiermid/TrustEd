const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { supabaseAdmin } = require('../lib/supabase');
const authenticate = require('../middleware/authenticate');

// POST /auth/sync
router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token.' } });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
    }

    let dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      linkedinConnected: dbUser.linkedinConnected,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /auth/linkedin/connect
router.post('/linkedin/connect', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    const linkedinIdentity = user.identities?.find(i => i.provider === 'linkedin_oidc');
    const linkedinProfileUrl = linkedinIdentity?.identity_data?.profile_url || null;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { linkedinConnected: true, linkedinProfileUrl },
    });

    res.json({
      linkedinConnected: updated.linkedinConnected,
      linkedinProfileUrl: updated.linkedinProfileUrl,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
