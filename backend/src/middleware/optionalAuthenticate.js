const prisma = require('../lib/prisma');
const { supabase } = require('../lib/supabase');

async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    req.user = null;
    return next();
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  req.user = dbUser || null;
  next();
}

module.exports = optionalAuthenticate;
