require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../src/lib/prisma');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const dbUsers = await prisma.user.findMany({ select: { id: true, supabaseId: true, avatarUrl: true } });
  console.log(`Found ${dbUsers.length} users in DB`);

  let updated = 0;
  for (const dbUser of dbUsers) {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(dbUser.supabaseId);
    if (error || !user) {
      console.warn(`  skip ${dbUser.supabaseId}: ${error?.message}`);
      continue;
    }

    const meta = user.user_metadata || {};
    const resolvedAvatar = meta.avatar_url || meta.picture || null;

    if (resolvedAvatar && dbUser.avatarUrl !== resolvedAvatar) {
      await prisma.user.update({ where: { id: dbUser.id }, data: { avatarUrl: resolvedAvatar } });
      console.log(`  updated ${user.email}`);
      updated++;
    }
  }

  console.log(`Done — updated ${updated} avatar(s)`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
