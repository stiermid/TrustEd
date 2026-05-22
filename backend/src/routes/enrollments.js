const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');

// GET /users/me/enrollments
router.get('/users/me/enrollments', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: {
        course: { select: { id: true, title: true, provider: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      data: enrollments.map(e => ({
        id: e.id,
        status: e.status,
        createdAt: e.createdAt,
        verifiedAt: e.verifiedAt,
        course: e.course,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// POST /courses/:courseId/enroll
router.post('/courses/:courseId/enroll', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.' } });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } },
    });
    if (existing) {
      return res.status(409).json({ error: { code: 'ALREADY_ENROLLED', message: 'Already enrolled in this course.' } });
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: req.user.id, courseId, status: 'PENDING' },
    });

    res.status(201).json({
      id: enrollment.id,
      courseId: enrollment.courseId,
      userId: enrollment.userId,
      status: enrollment.status,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// GET /courses/:courseId/enrollments (Admin only)
router.get('/courses/:courseId/enrollments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, linkedinConnected: true, linkedinProfileUrl: true },
        },
      },
    });

    res.json({
      data: enrollments.map(e => ({
        id: e.id,
        status: e.status,
        user: e.user,
        verifiedAt: e.verifiedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

// PATCH /enrollments/:id/verify (Admin only)
router.patch('/enrollments/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'status must be VERIFIED or REJECTED.' } });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!enrollment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Enrollment not found.' } });
    }

    if (!enrollment.user.linkedinConnected) {
      return res.status(403).json({
        error: { code: 'LINKEDIN_NOT_CONNECTED', message: 'User must connect LinkedIn before verification.' },
      });
    }

    const updated = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedById: req.user.id,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
  }
});

module.exports = router;
