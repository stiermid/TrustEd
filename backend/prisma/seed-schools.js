const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_COURSES = [
  // ── PeerStack ─────────────────────────────────────────────────────
  {
    title: 'Full-Stack Web Development Bootcamp',
    provider: 'PeerStack',
    category: 'Web Development',
    duration: '6 months',
    featured: true,
    description: 'Intensive bootcamp covering modern full-stack development from scratch. Build real products with HTML/CSS, JavaScript, React, Node.js, and PostgreSQL. Mentored by Baku-based engineers with industry experience.',
    url: 'https://peerstack.az',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs', 'Responsive Design'],
    careerPaths: ['Full-Stack Developer', 'Front-End Developer', 'Back-End Developer', 'Junior Web Engineer'],
  },
  {
    title: 'Mobile App Development with Flutter',
    provider: 'PeerStack',
    category: 'Mobile Development',
    duration: '4 months',
    featured: false,
    description: 'Build cross-platform iOS and Android apps using Flutter and Dart. Covers state management, REST API integration, Firebase, local storage, and publishing to the App Store and Google Play.',
    url: 'https://peerstack.az',
    skills: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'State Management', 'UI Design', 'Android', 'iOS'],
    careerPaths: ['Mobile Developer', 'Flutter Engineer', 'iOS Developer', 'Android Developer'],
  },
  {
    title: 'UI/UX Design & Prototyping',
    provider: 'PeerStack',
    category: 'Design',
    duration: '3 months',
    featured: false,
    description: 'Learn the full design process from user research to high-fidelity prototypes. Covers Figma, design systems, usability testing, and handoff to developers. Includes portfolio-ready capstone projects.',
    url: 'https://peerstack.az',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Usability Testing', 'Typography'],
    careerPaths: ['UI Designer', 'UX Designer', 'Product Designer', 'Interaction Designer'],
  },

  // ── Div Academy ──────────────────────────────────────────────────
  {
    title: 'Front-End Development Program',
    provider: 'Div Academy',
    category: 'Frontend Development',
    duration: '5 months',
    featured: true,
    description: 'Comprehensive front-end program taught in Azerbaijani and English. Covers HTML5, CSS3, JavaScript ES6+, React, and deployment. Small class sizes ensure personalized attention from experienced instructors.',
    url: 'https://divacademy.az',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Bootstrap', 'Git', 'Responsive Design', 'REST APIs'],
    careerPaths: ['Front-End Developer', 'React Developer', 'UI Developer', 'Web Designer'],
  },
  {
    title: 'Python & Data Analysis',
    provider: 'Div Academy',
    category: 'Data Science',
    duration: '4 months',
    featured: false,
    description: 'Practical Python course focused on real data problems. Covers Python fundamentals, Pandas, NumPy, Matplotlib, SQL, and introductory machine learning with Scikit-learn. Final project uses local Azerbaijani datasets.',
    url: 'https://divacademy.az',
    skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Scikit-learn', 'Jupyter', 'Data Visualization'],
    careerPaths: ['Data Analyst', 'Python Developer', 'Business Intelligence Analyst', 'Data Engineer'],
  },
  {
    title: 'Back-End Development with Node.js',
    provider: 'Div Academy',
    category: 'Backend Development',
    duration: '4 months',
    featured: false,
    description: 'Server-side development program covering Node.js, Express, PostgreSQL, REST API design, authentication, and deployment on cloud platforms. Graduates build and ship a production-ready API as their capstone.',
    url: 'https://divacademy.az',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'REST APIs', 'JWT', 'Docker', 'Git', 'Linux'],
    careerPaths: ['Back-End Developer', 'Node.js Engineer', 'API Developer', 'Full-Stack Developer'],
  },
  {
    title: 'Digital Marketing & Growth',
    provider: 'Div Academy',
    category: 'Digital Marketing',
    duration: '3 months',
    featured: false,
    description: 'Hands-on digital marketing program covering SEO, Google Ads, social media strategy, email marketing, and analytics. Includes live campaigns run on real budgets with Azerbaijani businesses as clients.',
    url: 'https://divacademy.az',
    skills: ['SEO', 'Google Ads', 'Social Media', 'Email Marketing', 'Google Analytics', 'Content Strategy', 'A/B Testing'],
    careerPaths: ['Digital Marketer', 'SEO Specialist', 'Growth Marketer', 'Social Media Manager'],
  },
];

const REVIEWS = {
  'Full-Stack Web Development Bootcamp': [
    { name: 'Leyla Hasanova',  rating: 5, content: 'Best decision I\'ve made career-wise. The mentors are actual Baku-based engineers who share real project experience, not just theory. Got hired as a junior dev two months after graduating.' },
    { name: 'Kamran Aliyev',   rating: 4, content: 'The pace is intense but the support system is solid. Group projects felt like real sprints — daily standups, code reviews, everything. That preparation made interviews much less scary.' },
    { name: 'Gunel Rzayeva',   rating: 5, content: 'Finally a local bootcamp that takes quality seriously. The React and Node curriculum is on par with anything I\'ve seen from international programs. Highly recommend to anyone in Baku looking to switch careers.' },
  ],
  'Mobile App Development with Flutter': [
    { name: 'Tural Huseynov',  rating: 5, content: 'Flutter is the right bet for the local market and PeerStack teaches it well. Firebase integration and state management modules saved me weeks of self-study. Published my first app to Play Store mid-course.' },
    { name: 'Nigar Mammadova', rating: 4, content: 'The cross-platform angle was exactly what I needed. One codebase for both platforms is a real advantage when working solo or in small teams. Instructors were responsive and genuinely helpful.' },
  ],
  'UI/UX Design & Prototyping': [
    { name: 'Farid Isgandarov',rating: 5, content: 'I came in as a developer with zero design background. By the end I was running usability tests and presenting to stakeholders. The Figma component library project alone is portfolio gold.' },
    { name: 'Aydan Quliyeva',  rating: 4, content: 'Solid practical curriculum. The usability testing module using real participants was an eye-opener — seeing users struggle with an interface I designed humbled me quickly and improved my work dramatically.' },
  ],
  'Front-End Development Program': [
    { name: 'Rauf Babayev',    rating: 5, content: 'The small class size made a huge difference. Instructors actually knew your name and your code. Got personal feedback on every project which you simply don\'t get at larger schools.' },
    { name: 'Leyla Hasanova',  rating: 4, content: 'Curriculum is current and the bilingual instruction (Azerbaijani + English) is a real benefit for keeping up with technical terms. The React module was thorough and project-heavy.' },
    { name: 'Gunel Rzayeva',   rating: 4, content: 'Strong program with real career support. The mock interview sessions in the final weeks helped me land my first offer. Would choose Div Academy again without hesitation.' },
  ],
  'Python & Data Analysis': [
    { name: 'Kamran Aliyev',   rating: 5, content: 'The capstone project using local Azerbaijani e-commerce data made everything click. Analysing something real and relevant instead of generic toy datasets kept me engaged all the way through.' },
    { name: 'Tural Huseynov',  rating: 4, content: 'Pandas and Matplotlib sections are the strongest part. SQL module could be longer but covers the essentials. The instructors have actual data industry backgrounds which shows in every lecture.' },
    { name: 'Aydan Quliyeva',  rating: 4, content: 'I came with no programming experience and finished confident enough to apply for analyst roles. The Jupyter notebooks from every class are a great reference to keep long after the course ends.' },
  ],
  'Back-End Development with Node.js': [
    { name: 'Nigar Mammadova', rating: 5, content: 'The capstone API project is production-quality — authentication, rate limiting, proper error handling, deployed with Docker. I put it on my resume and it got me through three interview rounds.' },
    { name: 'Farid Isgandarov',rating: 4, content: 'PostgreSQL and JWT sections are excellent. Would have liked more time on message queues and caching but the REST API design content alone is worth the tuition. Great step up from front-end.' },
  ],
  'Digital Marketing & Growth': [
    { name: 'Rauf Babayev',    rating: 4, content: 'Running live Google Ads campaigns on actual budgets for Azerbaijani SMEs was invaluable. You feel the real stakes of every keyword decision. No course I\'ve seen offers this level of hands-on practice.' },
    { name: 'Kamran Aliyev',   rating: 3, content: 'Good foundational content. The SEO and analytics modules are strong. Social media section felt a bit surface-level but the instructors are experienced and the network you build here is worth a lot in Baku.' },
  ],
};

async function main() {
  console.log('🌱 Seeding PeerStack & Div Academy courses, enrollments, and reviews...\n');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const mockUsers = await prisma.user.findMany({ where: { email: { endsWith: '@trusted.dev' } } });
  const userByName = Object.fromEntries(mockUsers.map(u => [u.name, u]));

  // Upsert courses
  for (const course of NEW_COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: course.title, provider: course.provider } });
    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data: course });
      console.log(`  🔄  Updated: ${course.title}`);
    } else {
      await prisma.course.create({ data: { ...course, createdById: admin.id } });
      console.log(`  ✨  Created: ${course.title}`);
    }
  }

  console.log('');

  // Enrollments + reviews
  const courses = await prisma.course.findMany();
  const courseMap = Object.fromEntries(courses.map(c => [c.title, c]));

  let enrollCount = 0, reviewCount = 0;

  for (const [courseTitle, reviews] of Object.entries(REVIEWS)) {
    const course = courseMap[courseTitle];
    if (!course) { console.log(`  ⚠  Course not found: ${courseTitle}`); continue; }

    for (const r of reviews) {
      const user = userByName[r.name];
      if (!user) { console.log(`  ⚠  User not found: ${r.name}`); continue; }

      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: { userId: user.id, courseId: course.id, status: 'VERIFIED', verifiedAt: new Date(), verifiedById: admin?.id ?? null },
        });
        enrollCount++;
      }

      const existingReview = await prisma.review.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (!existingReview) {
        await prisma.review.create({ data: { userId: user.id, courseId: course.id, rating: r.rating, content: r.content } });
        reviewCount++;
        console.log(`  ✍  "${courseTitle}" — ${r.name} (${r.rating}★)`);
      }
    }
  }

  console.log(`\n✅  Done — ${NEW_COURSES.length} courses, ${enrollCount} enrollments, ${reviewCount} reviews seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
