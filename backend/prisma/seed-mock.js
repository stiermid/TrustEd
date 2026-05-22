const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_USERS = [
  { name: 'Leyla Hasanova',    email: 'leyla.hasanova.mock@trusted.dev' },
  { name: 'Kamran Aliyev',     email: 'kamran.aliyev.mock@trusted.dev' },
  { name: 'Nigar Mammadova',   email: 'nigar.mammadova.mock@trusted.dev' },
  { name: 'Tural Huseynov',    email: 'tural.huseynov.mock@trusted.dev' },
  { name: 'Gunel Rzayeva',     email: 'gunel.rzayeva.mock@trusted.dev' },
  { name: 'Farid Isgandarov',  email: 'farid.isgandarov.mock@trusted.dev' },
  { name: 'Aydan Quliyeva',    email: 'aydan.quliyeva.mock@trusted.dev' },
  { name: 'Rauf Babayev',      email: 'rauf.babayev.mock@trusted.dev' },
];

// courseTitle → array of { rating, content }
const REVIEWS = {
  'Software Engineering Program': [
    { rating: 5, content: 'Completely changed how I think about programming. The project-based approach forces you to actually build things from day one. C and Python gave me a solid foundation that I use every day now.' },
    { rating: 4, content: 'Intense but worth it. The low-level C track was brutal at first but by the end I understood memory management in a way bootcamps simply don\'t teach. Would recommend to anyone serious about software.' },
    { rating: 5, content: 'The peer learning model is underrated. You spend so much time explaining concepts to others that you deeply internalize everything. Two years flew by.' },
    { rating: 4, content: 'Curriculum is comprehensive and keeps up with industry. The only downside is the pace — it\'s relentless. Make sure you\'re ready to commit fully.' },
  ],
  'Full-Stack Web Development': [
    { rating: 5, content: 'Got my first job offer before even finishing the program. The React + Node stack they teach is exactly what companies are hiring for right now.' },
    { rating: 4, content: 'Strong practical focus. Every project felt like a real product, not a toy exercise. Docker and AWS deployment modules were particularly valuable.' },
    { rating: 3, content: 'Good foundation but felt the MongoDB section was rushed. SQL coverage was solid though. Overall a decent track if you want to go full-stack quickly.' },
  ],
  'Machine Learning Specialization': [
    { rating: 5, content: 'The math prerequisites scared me at first but the instructors ease you in really well. By week 6 I was building neural networks from scratch. Exceptional program.' },
    { rating: 4, content: 'TensorFlow coverage is thorough and the capstone project was genuinely challenging. Landed an ML internship directly because of this.' },
    { rating: 4, content: 'Great mix of theory and practice. Linear algebra refreshers at the start are essential — don\'t skip them. NumPy and Pandas sections alone are worth it.' },
  ],
  'Cybersecurity Specialization': [
    { rating: 5, content: 'Hands-on from day one. You\'re actually running penetration tests in sandboxed environments, not just reading theory. The OWASP module is eye-opening.' },
    { rating: 4, content: 'The reverse engineering section is uniquely thorough for a course at this level. Cryptography could go deeper but overall an excellent introduction to security.' },
    { rating: 5, content: 'Got me thinking like an attacker, which made me a much better defender. The CTF challenges embedded throughout keep you engaged throughout the whole program.' },
  ],
  'Data Science Specialization': [
    { rating: 4, content: 'Solid intro to the full data pipeline. The Pandas and visualization modules are polished. Statistics section could be more rigorous but covers what you need in practice.' },
    { rating: 3, content: 'Decent course but felt like it overlapped a lot with free resources online. The project work was the best part — real datasets, real problems.' },
    { rating: 4, content: 'The SQL + Python combo is taught really well together. By the end I was writing queries I\'d be proud to show in an interview.' },
  ],
  'DevOps / SysAdmin': [
    { rating: 5, content: 'Nginx, HAProxy, and CI/CD pipelines — all explained with actual hands-on servers. This isn\'t a theoretical devops course, you\'re configuring real infrastructure.' },
    { rating: 4, content: 'The Linux administration modules alone justify the time investment. Puppet was new to me and took a while to click, but the instructors are very responsive.' },
  ],
  'Low-Level Programming & Algorithms': [
    { rating: 5, content: 'If you want to truly understand how computers work, this is the track. Writing a malloc from scratch was one of the hardest and most rewarding things I\'ve ever done.' },
    { rating: 4, content: 'The algorithm complexity analysis is explained clearly without being overly academic. Binary trees and hash tables sections are particularly well done.' },
    { rating: 5, content: 'I came in knowing Python and left understanding C deeply. Pointer arithmetic finally makes sense. This track will make you a better programmer in any language.' },
  ],
  'Back-End Engineering Specialization': [
    { rating: 4, content: 'Flask and Node side by side is a great way to learn API design patterns that transcend any one language. Redis caching module was a highlight.' },
    { rating: 5, content: 'JWT and OAuth implementation from scratch was exactly what I needed. Too many courses just use libraries without explaining what\'s happening underneath.' },
    { rating: 4, content: 'Microservices section is solid for an intro. Would have liked more on message queues but the REST API design content is production-quality.' },
  ],
};

async function main() {
  console.log('🌱 Seeding mock users, enrollments, and reviews...\n');

  const courses = await prisma.course.findMany();
  const courseMap = Object.fromEntries(courses.map(c => [c.title, c]));
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // Create mock users (skip if already exist)
  const createdUsers = [];
  for (const u of MOCK_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      createdUsers.push(existing);
      console.log(`  ⏭  Skipped existing: ${u.name}`);
    } else {
      const created = await prisma.user.create({
        data: {
          supabaseId: crypto.randomUUID(),
          email: u.email,
          name: u.name,
          linkedinConnected: true,
          linkedinProfileUrl: `https://linkedin.com/in/${u.name.toLowerCase().replace(' ', '-')}`,
        },
      });
      createdUsers.push(created);
      console.log(`  ✨  Created user: ${u.name}`);
    }
  }

  console.log('');

  // For each course that has reviews defined, assign users and create enrollments + reviews
  let enrollCount = 0;
  let reviewCount = 0;
  let userIndex = 0;

  for (const [courseTitle, reviews] of Object.entries(REVIEWS)) {
    const course = courseMap[courseTitle];
    if (!course) { console.log(`  ⚠  Course not found: ${courseTitle}`); continue; }

    for (const reviewData of reviews) {
      const user = createdUsers[userIndex % createdUsers.length];
      userIndex++;

      // Enrollment
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedById: admin?.id ?? null,
          },
        });
        enrollCount++;
      }

      // Review
      const existingReview = await prisma.review.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            userId: user.id,
            courseId: course.id,
            rating: reviewData.rating,
            content: reviewData.content,
          },
        });
        reviewCount++;
        console.log(`  ✍  Review on "${courseTitle}" by ${user.name} (${reviewData.rating}★)`);
      } else {
        console.log(`  ⏭  Review already exists for ${user.name} on "${courseTitle}"`);
      }
    }
  }

  console.log(`\n✅  Done — ${createdUsers.length} users, ${enrollCount} enrollments, ${reviewCount} reviews seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
