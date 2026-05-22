const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HOLBERTON_COURSES = [
  {
    title: 'Software Engineering Program',
    provider: 'Holberton School',
    category: 'Software Engineering',
    duration: '24 months',
    featured: true,
    description: 'A 2-year, project-based software engineering program covering low-level programming in C, high-level scripting in Python, front-end and back-end web development, algorithms, data structures, and system administration. No prior experience required.',
    url: 'https://www.holbertonschool.com/programs/full-stack-software-engineering',
    skills: ['C', 'Python', 'JavaScript', 'HTML/CSS', 'SQL', 'Bash', 'Git', 'Linux', 'REST APIs', 'Data Structures', 'Algorithms'],
    careerPaths: ['Software Engineer', 'Full-Stack Developer', 'Backend Engineer', 'Systems Programmer'],
  },
  {
    title: 'Full-Stack Web Development',
    provider: 'Holberton School',
    category: 'Web Development',
    duration: '12 months',
    featured: true,
    description: 'Hands-on full-stack specialization covering HTML/CSS, JavaScript (ES6+), React, Node.js, RESTful APIs, SQL/NoSQL databases, and deployment. Build real-world applications from scratch.',
    url: 'https://www.holbertonschool.com/programs/full-stack-software-engineering',
    skills: ['React', 'Node.js', 'JavaScript', 'HTML/CSS', 'MySQL', 'MongoDB', 'REST APIs', 'Docker', 'AWS'],
    careerPaths: ['Front-End Developer', 'Back-End Developer', 'Full-Stack Developer', 'Web Engineer'],
  },
  {
    title: 'Machine Learning Specialization',
    provider: 'Holberton School',
    category: 'Machine Learning',
    duration: '9 months',
    featured: false,
    description: 'An applied machine learning track covering Python, NumPy, linear algebra, supervised and unsupervised learning, neural networks, and TensorFlow. Focused on building and deploying ML models.',
    url: 'https://www.holbertonschool.com/programs/machine-learning',
    skills: ['Python', 'TensorFlow', 'NumPy', 'Pandas', 'Scikit-learn', 'Linear Algebra', 'Neural Networks', 'Keras'],
    careerPaths: ['ML Engineer', 'AI Researcher', 'Data Scientist', 'Deep Learning Engineer'],
  },
  {
    title: 'Cybersecurity Specialization',
    provider: 'Holberton School',
    category: 'Cybersecurity',
    duration: '9 months',
    featured: false,
    description: 'A security-focused specialization covering network security, penetration testing, ethical hacking, reverse engineering, cryptography, web vulnerabilities (OWASP Top 10), and incident response.',
    url: 'https://www.holbertonschool.com/programs/cybersecurity',
    skills: ['Penetration Testing', 'Linux', 'Network Security', 'Cryptography', 'OWASP', 'Reverse Engineering', 'Bash', 'Python'],
    careerPaths: ['Cybersecurity Analyst', 'Penetration Tester', 'Security Engineer', 'Incident Responder'],
  },
  {
    title: 'Data Science Specialization',
    provider: 'Holberton School',
    category: 'Data Science',
    duration: '9 months',
    featured: false,
    description: 'A data-driven specialization using Python, Pandas, Matplotlib, SQL, and statistical analysis. Covers data wrangling, exploratory data analysis, visualization, and building data pipelines.',
    url: 'https://www.holbertonschool.com/programs/data-science',
    skills: ['Python', 'Pandas', 'Matplotlib', 'SQL', 'Statistics', 'Jupyter', 'NumPy', 'Data Visualization'],
    careerPaths: ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst', 'Data Engineer'],
  },
  {
    title: 'DevOps / SysAdmin',
    provider: 'Holberton School',
    category: 'DevOps',
    duration: '6 months',
    featured: false,
    description: 'Systems and operations track covering Linux administration, Bash scripting, networking fundamentals, web server configuration (Nginx, HAProxy), CI/CD pipelines, Docker, and cloud deployment.',
    url: 'https://www.holbertonschool.com/programs/devops',
    skills: ['Linux', 'Bash', 'Docker', 'Nginx', 'CI/CD', 'Networking', 'HAProxy', 'Puppet', 'AWS'],
    careerPaths: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer', 'Systems Administrator'],
  },
  {
    title: 'Low-Level Programming & Algorithms',
    provider: 'Holberton School',
    category: 'Systems Programming',
    duration: '6 months',
    featured: false,
    description: 'Deep-dive into C programming, memory management, pointers, data structures (linked lists, trees, hash tables), sorting algorithms, bit manipulation, and understanding how computers work at the system level.',
    url: 'https://www.holbertonschool.com',
    skills: ['C', 'Memory Management', 'Pointers', 'Linked Lists', 'Binary Trees', 'Hash Tables', 'Sorting Algorithms', 'Assembly'],
    careerPaths: ['Systems Programmer', 'Embedded Engineer', 'Firmware Developer', 'OS Developer'],
  },
  {
    title: 'Back-End Engineering Specialization',
    provider: 'Holberton School',
    category: 'Backend Development',
    duration: '9 months',
    featured: false,
    description: 'Focused specialization on server-side development covering Python/Flask, Node.js, RESTful API design, MySQL, MongoDB, Redis, authentication (JWT/OAuth), and scalable architecture patterns.',
    url: 'https://www.holbertonschool.com',
    skills: ['Python', 'Flask', 'Node.js', 'MySQL', 'MongoDB', 'Redis', 'JWT', 'OAuth', 'REST APIs', 'Microservices'],
    careerPaths: ['Backend Engineer', 'API Developer', 'Node.js Developer', 'Python Developer'],
  },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const anyUser   = await prisma.user.findFirst();
  const creator   = adminUser || anyUser;

  if (!creator) {
    console.error('❌  No users found in the database.');
    console.error('   Please sign in to the app first so a user record is created, then re-run the seed.');
    process.exit(1);
  }

  console.log(`✅  Using "${creator.name}" (${creator.email}) as course creator.\n`);

  let created = 0;
  let updated = 0;

  for (const course of HOLBERTON_COURSES) {
    const existing = await prisma.course.findFirst({
      where: { title: course.title, provider: course.provider },
    });

    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data: course });
      console.log(`  🔄  Updated: ${course.title}`);
      updated++;
    } else {
      await prisma.course.create({ data: { ...course, createdById: creator.id } });
      console.log(`  ✨  Created: ${course.title}`);
      created++;
    }
  }

  console.log(`\n✅  Seed complete — ${created} created, ${updated} updated.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
