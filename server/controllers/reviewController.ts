import { Request, Response } from 'express';
import { db } from '../db/store';
import { IReviewDocument } from '../db/schema';
import { Review } from '../../src/types';

async function formatReview(doc: IReviewDocument): Promise<Review> {
  const targetId = doc.targetUserId || doc.sellerId || '';
  const [reviewer, target, prod] = await Promise.all([
    db.findUserById(doc.reviewerId),
    targetId ? db.findUserById(targetId) : Promise.resolve(undefined),
    doc.productId ? db.findProductById(doc.productId) : Promise.resolve(undefined),
  ]);

  return {
    id: doc._id,
    reviewerId: doc.reviewerId,
    reviewerName: reviewer?.name || 'Fellow Student',
    reviewerAvatar: reviewer?.avatar,
    reviewerRole: reviewer?.role,
    targetUserId: targetId,
    targetUserName: target?.name || 'Campus Member',
    transactionId: doc.transactionId,
    productId: doc.productId,
    productTitle: prod?.title,
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt,
  };
}

export async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    const { targetUserId } = req.query;
    let reviews = await db.getReviews();

    if (targetUserId) {
      reviews = reviews.filter((r) => r.targetUserId === targetUserId);
    }

    const formatted = await Promise.all(reviews.map(formatReview));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve reviews.' });
  }
}

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewerId = req.user?._id;
    if (!reviewerId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { targetUserId, transactionId, productId, rating, comment } = req.body;
    if (!targetUserId || !rating || !comment) {
      res.status(400).json({ success: false, error: 'Target user, rating (1-5), and comment are required.' });
      return;
    }

    if (reviewerId === targetUserId) {
      res.status(400).json({ success: false, error: 'You cannot write a review for yourself.' });
      return;
    }

    const newRev: IReviewDocument = {
      _id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reviewerId,
      targetUserId,
      transactionId,
      productId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const created = await db.createReview(newRev);

    const reviewer = await db.findUserById(reviewerId);
    await db.createNotification({
      _id: `notif-${Date.now()}`,
      userId: targetUserId,
      type: 'review',
      title: 'You received a new review! 🌟',
      message: `${reviewer?.name || 'A student'} left a ${newRev.rating}★ review: "${newRev.comment.slice(0, 60)}..."`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: await formatReview(created),
      message: 'Review submitted successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create review.' });
  }
}
