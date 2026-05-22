const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_COURSES = [
  // ── Coursera ──────────────────────────────────────────────────────
  {
    title: 'Google Data Analytics Professional Certificate',
    provider: 'Coursera',
    category: 'Data Analytics',
    duration: '6 months',
    featured: true,
    description: 'Prepare for a career in data analytics with Google. Learn the foundations of data analysis, spreadsheets, SQL, Tableau, and R — no prior experience required. Earn a credential recognized by top employers.',
    url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    skills: ['SQL', 'R', 'Tableau', 'Spreadsheets', 'Data Cleaning', 'Data Visualization', 'Statistics', 'BigQuery'],
    careerPaths: ['Data Analyst', 'Business Analyst', 'Marketing Analyst', 'Operations Analyst'],
  },
  {
    title: 'IBM Full Stack Software Developer',
    provider: 'Coursera',
    category: 'Full Stack Development',
    duration: '12 months',
    featured: false,
    description: 'Master full-stack development with IBM. Build cloud-native applications using React, Node.js, Python/Django, Docker, Kubernetes, and OpenShift. Includes hands-on projects and an IBM digital credential.',
    url: 'https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer',
    skills: ['React', 'Node.js', 'Python', 'Django', 'Docker', 'Kubernetes', 'REST APIs', 'Cloud', 'Git'],
    careerPaths: ['Full-Stack Developer', 'Cloud Developer', 'Back-End Developer', 'DevOps Engineer'],
  },
  {
    title: 'Meta Front-End Developer Certificate',
    provider: 'Coursera',
    category: 'Frontend Development',
    duration: '7 months',
    featured: false,
    description: 'Launch your career as a front-end developer. Learn HTML, CSS, JavaScript, React, UI/UX design principles, and version control — all taught by Meta engineers. Capstone involves building a responsive React app.',
    url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'UI/UX', 'Figma', 'Git', 'Responsive Design', 'Bootstrap'],
    careerPaths: ['Front-End Developer', 'UI Developer', 'React Developer', 'Web Designer'],
  },
  {
    title: 'Deep Learning Specialization',
    provider: 'Coursera',
    category: 'Deep Learning',
    duration: '4 months',
    featured: true,
    description: 'Andrew Ng\'s legendary deep learning series. Five courses covering neural networks, CNNs, RNNs, hyperparameter tuning, and structuring ML projects. The gold standard for applied deep learning education.',
    url: 'https://www.coursera.org/specializations/deep-learning',
    skills: ['Python', 'TensorFlow', 'Neural Networks', 'CNNs', 'RNNs', 'Hyperparameter Tuning', 'Batch Normalization'],
    careerPaths: ['Deep Learning Engineer', 'ML Engineer', 'AI Researcher', 'Computer Vision Engineer'],
  },

  // ── Udemy ─────────────────────────────────────────────────────────
  {
    title: 'The Complete Web Developer Bootcamp',
    provider: 'Udemy',
    category: 'Web Development',
    duration: '3 months',
    featured: false,
    description: 'The most comprehensive web development course on Udemy. Covers HTML5, CSS3, JavaScript ES6+, React, Node.js, Express, MongoDB, and deployment. 60+ hours of content with real-world projects.',
    url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Bootstrap'],
    careerPaths: ['Web Developer', 'Full-Stack Developer', 'Front-End Developer', 'Freelance Developer'],
  },
  {
    title: 'Python Bootcamp: Zero to Hero',
    provider: 'Udemy',
    category: 'Programming',
    duration: '2 months',
    featured: false,
    description: 'The most popular Python course online. From absolute basics to advanced topics — decorators, generators, OOP, file I/O, web scraping, and data analysis with Pandas. 155,000+ students enrolled.',
    url: 'https://www.udemy.com/course/complete-python-bootcamp/',
    skills: ['Python', 'OOP', 'Pandas', 'NumPy', 'Web Scraping', 'File I/O', 'Decorators', 'Generators'],
    careerPaths: ['Python Developer', 'Data Analyst', 'Automation Engineer', 'Backend Developer'],
  },
  {
    title: 'AWS Certified Solutions Architect',
    provider: 'Udemy',
    category: 'Cloud Computing',
    duration: '3 months',
    featured: false,
    description: 'Prepare for the AWS Solutions Architect Associate exam. Covers EC2, S3, VPC, IAM, RDS, Lambda, CloudFront, and more. Includes practice exams and hands-on labs in real AWS accounts.',
    url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
    skills: ['AWS', 'EC2', 'S3', 'VPC', 'IAM', 'Lambda', 'RDS', 'CloudFront', 'Cloud Architecture'],
    careerPaths: ['Cloud Architect', 'DevOps Engineer', 'Cloud Engineer', 'Solutions Architect'],
  },
];

const REVIEWS = {
  'Google Data Analytics Professional Certificate': [
    { name: 'Leyla Hasanova',  rating: 5, content: 'Completely career-changing. I had zero analytics background and landed a junior data analyst role within two months of finishing. The Tableau and SQL modules are especially practical.' },
    { name: 'Rauf Babayev',    rating: 4, content: 'Well-paced and genuinely beginner-friendly. The R section was challenging but rewarding. Google\'s name on the certificate definitely opened doors in interviews.' },
    { name: 'Gunel Rzayeva',   rating: 4, content: 'Solid foundation. The capstone projects use real datasets which makes a big difference. Wish the statistics section went a bit deeper but overall excellent value.' },
  ],
  'IBM Full Stack Software Developer': [
    { name: 'Kamran Aliyev',   rating: 4, content: 'The Kubernetes and OpenShift modules are genuinely unique — I haven\'t seen them covered this well in any other beginner course. IBM\'s cloud labs are free and work seamlessly.' },
    { name: 'Tural Huseynov',  rating: 3, content: 'Good breadth but some sections feel rushed. Django and React deserve more time. That said, the cloud-native focus is relevant and the IBM credential has real recognition.' },
    { name: 'Aydan Quliyeva',  rating: 4, content: 'Finished this while working full-time. The self-paced format is flexible and the project-based approach means you always have something to show. Strong recommendation.' },
  ],
  'Meta Front-End Developer Certificate': [
    { name: 'Nigar Mammadova', rating: 5, content: 'Meta engineers teaching React — you can feel the real-world experience in every module. The UX design principles section was unexpected and extremely valuable.' },
    { name: 'Farid Isgandarov',rating: 4, content: 'The Figma integration with the React capstone was a standout. You\'re not just coding — you design, prototype, and then build. That workflow is exactly how it works in industry.' },
  ],
  'Deep Learning Specialization': [
    { name: 'Rauf Babayev',    rating: 5, content: 'Andrew Ng is simply the best ML educator alive. The intuitive explanations of backpropagation and optimization algorithms are worth the price alone. A must for anyone serious about AI.' },
    { name: 'Leyla Hasanova',  rating: 5, content: 'I took this after my ML course and it was the perfect next step. CNNs and RNNs explained from first principles. The hyperparameter tuning week changed how I approach all my models.' },
    { name: 'Kamran Aliyev',   rating: 4, content: 'Dense but exceptional. Budget extra time for the math-heavy weeks. TensorFlow assignments are well-designed and the community forums are active if you get stuck.' },
  ],
  'The Complete Web Developer Bootcamp': [
    { name: 'Tural Huseynov',  rating: 4, content: 'Best bang for money on any learning platform. Bought it for $15 during a sale and the content rivals courses 10x the price. Node.js and MongoDB sections are particularly strong.' },
    { name: 'Gunel Rzayeva',   rating: 5, content: 'I went from knowing nothing about web dev to deploying a full-stack app in three months. The instructor\'s energy keeps you motivated through 60+ hours of content.' },
    { name: 'Nigar Mammadova', rating: 3, content: 'Good for absolute beginners but the React section feels dated. Some APIs used in examples are deprecated. Still, the fundamentals are solid and the projects are genuinely fun to build.' },
  ],
  'Python Bootcamp: Zero to Hero': [
    { name: 'Farid Isgandarov',rating: 5, content: 'The most approachable Python course I\'ve found. Decorators and generators explained so clearly I finally understood why they exist, not just how to use them.' },
    { name: 'Aydan Quliyeva',  rating: 4, content: 'Finished in 6 weeks working evenings. The web scraping section with BeautifulSoup was a bonus I didn\'t expect. Great stepping stone into data science.' },
  ],
  'AWS Certified Solutions Architect': [
    { name: 'Rauf Babayev',    rating: 5, content: 'Passed the SAA-C03 exam on first attempt. The practice exams are harder than the real thing which is exactly what you want. VPC and IAM sections are the most thorough I\'ve seen.' },
    { name: 'Kamran Aliyev',   rating: 4, content: 'Hands-on labs in real AWS accounts make this stand out. You\'re not just watching — you\'re actually configuring EC2 instances, setting up S3 policies, and deploying Lambda functions.' },
    { name: 'Leyla Hasanova',  rating: 4, content: 'Dense course but worth every hour. The architecture diagrams throughout are excellent visual aids. Got a cloud engineer interview directly because of the AWS cert on my resume.' },
  ],
};

async function main() {
  console.log('🌱 Seeding Coursera & Udemy courses, enrollments, and reviews...\n');

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

  console.log(`\n✅  Done — 7 courses, ${enrollCount} enrollments, ${reviewCount} reviews seeded.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
