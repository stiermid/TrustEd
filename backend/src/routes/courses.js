const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');

const COURSE_SELECT = {
  id: true, title: true, provider: true, description: true, url: true,
  logoUrl: true, category: true, duration: true, skills: true,
  careerPaths: true, featured: true, createdAt: true,
  _count: { select: { reviews: true } },
};

// GET /courses
router.get('/', async (req, res) => {
  try {
    const { search, provider, category, featured, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(provider && { provider: { contains: provider, mode: 'insensitive' } }),
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(featured === 'true' && { featured: true }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({ where, skip, take: parseInt(limit), select: COURSE_SELECT, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] }),
      prisma.course.count({ where }),
    ]);

    const courseIds = courses.map(c => c.id);
    const ratings = await prisma.review.groupBy({
      by: ['courseId'], where: { courseId: { in: courseIds } }, _avg: { rating: true },
    });
    const ratingMap = Object.fromEntries(ratings.map(r => [r.courseId, r._avg.rating]));

    const data = courses.map(c => ({
      ...c, _count: undefined,
      averageRating: ratingMap[c.id] != null ? Math.round(ratingMap[c.id] * 10) / 10 : null,
      reviewCount: c._count.reviews,
    }));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id }, select: COURSE_SELECT });
    if (!course) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });

    const ratingAgg = await prisma.review.aggregate({ where: { courseId: course.id }, _avg: { rating: true } });

    res.json({
      ...course, _count: undefined,
      averageRating: ratingAgg._avg.rating != null ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      reviewCount: course._count.reviews,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /courses (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, provider, description, url, logoUrl, category, duration, skills, careerPaths, featured } = req.body;
    if (!title || !provider) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'title and provider are required.' } });
    }
    const course = await prisma.course.create({
      data: {
        title, provider, description, url, logoUrl, category, duration,
        skills: skills || [], careerPaths: careerPaths || [],
        featured: featured || false, createdById: req.user.id,
      },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// PATCH /courses/:id (Admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, provider, description, url, logoUrl, category, duration, skills, careerPaths, featured } = req.body;
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(provider !== undefined && { provider }),
        ...(description !== undefined && { description }),
        ...(url !== undefined && { url }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(category !== undefined && { category }),
        ...(duration !== undefined && { duration }),
        ...(skills !== undefined && { skills }),
        ...(careerPaths !== undefined && { careerPaths }),
        ...(featured !== undefined && { featured }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// DELETE /courses/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
