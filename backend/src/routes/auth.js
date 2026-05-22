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

    const meta = user.user_metadata || {};
    const resolvedName =
      meta.full_name ||
      meta.name ||
      [meta.given_name, meta.family_name].filter(Boolean).join(' ') ||
      user.email;
    const resolvedAvatar = meta.avatar_url || meta.picture || null;
    const hasLinkedIn = user.identities?.some(i => i.provider === 'linkedin_oidc') ?? false;

    let dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email,
          name: resolvedName,
          avatarUrl: resolvedAvatar,
          linkedinConnected: hasLinkedIn,
        },
      });
    } else {
      const avatarChanged = resolvedAvatar && dbUser.avatarUrl !== resolvedAvatar;
      const needsUpdate =
        (dbUser.name === dbUser.email && resolvedName !== dbUser.email) ||
        avatarChanged ||
        (hasLinkedIn && !dbUser.linkedinConnected);

      if (needsUpdate) {
        dbUser = await prisma.user.update({
          where: { supabaseId: user.id },
          data: {
            ...(dbUser.name === dbUser.email && { name: resolvedName }),
            ...(avatarChanged && { avatarUrl: resolvedAvatar }),
            ...(hasLinkedIn && !dbUser.linkedinConnected && { linkedinConnected: true }),
          },
        });
      }
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      linkedinConnected: dbUser.linkedinConnected,
      linkedinProfileUrl: dbUser.linkedinProfileUrl,
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
    if (!linkedinIdentity) {
      return res.status(400).json({ error: { code: 'LINKEDIN_NOT_LINKED', message: 'LinkedIn account not linked via Supabase.' } });
    }

    const linkedinProfileUrl = req.body.linkedinProfileUrl || null;

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
