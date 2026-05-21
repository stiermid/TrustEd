const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { anonymizeReviews } = require('../utils/anonymize');

// GET /courses/:courseId/reviews
router.get('/courses/:courseId/reviews', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    const [reviews, connections] = await Promise.all([
      prisma.review.findMany({
        where: { courseId },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.connection.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
        },
      }),
    ]);

    res.json({ data: anonymizeReviews(reviews, req.user.id, connections) });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /courses/:courseId/reviews
router.post('/courses/:courseId/reviews', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, content } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'rating must be an integer between 1 and 5.' } });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'content must be a non-empty string.' } });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } },
    });

    if (!enrollment || enrollment.status !== 'VERIFIED') {
      return res.status(403).json({ error: { code: 'ENROLLMENT_NOT_VERIFIED', message: 'You must have a verified enrollment to write a review.' } });
    }

    const existing = await prisma.review.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } },
    });
    if (existing) {
      return res.status(409).json({ error: { code: 'REVIEW_ALREADY_EXISTS', message: 'You have already reviewed this course.' } });
    }

    const review = await prisma.review.create({
      data: { userId: req.user.id, courseId, rating, content },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// PATCH /reviews/:id
router.patch('/reviews/:id', authenticate, async (req, res) => {
  try {
    const { rating, content } = req.body;

    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review || review.userId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Review not found or access denied.' } });
    }

    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'rating must be an integer between 1 and 5.' } });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(content !== undefined && { content }),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// DELETE /reviews/:id
router.delete('/reviews/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review || review.userId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Review not found or access denied.' } });
    }

    await prisma.review.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
