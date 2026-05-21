const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');

// GET /courses
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, provider, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(provider && { provider }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { _count: { select: { reviews: true } } },
      }),
      prisma.course.count({ where }),
    ]);

    const courseIds = courses.map(c => c.id);
    const ratings = await prisma.review.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
    });
    const ratingMap = Object.fromEntries(ratings.map(r => [r.courseId, r._avg.rating]));

    const data = courses.map(c => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      description: c.description,
      averageRating: ratingMap[c.id] != null ? Math.round(ratingMap[c.id] * 10) / 10 : null,
      reviewCount: c._count.reviews,
    }));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /courses/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { reviews: true } } },
    });

    if (!course) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    }

    const ratingAgg = await prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
    });

    res.json({
      id: course.id,
      title: course.title,
      provider: course.provider,
      description: course.description,
      url: course.url,
      averageRating: ratingAgg._avg.rating != null ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      reviewCount: course._count.reviews,
      createdAt: course.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /courses (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, provider, description, url } = req.body;

    if (!title || !provider) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'title and provider are required.' } });
    }

    const course = await prisma.course.create({
      data: { title, provider, description, url, createdById: req.user.id },
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
