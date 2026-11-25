import { Request, Response } from 'express';
import { db } from '../db/store';
import { Notification } from '../../src/types';

export function formatNotification(doc: any): Notification {
  return {
    id: doc._id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    link: doc.link,
    avatar: doc.avatar,
    timestamp: doc.createdAt,
  };
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const docs = await db.getNotificationsByUser(req.user._id);
  const list = docs.map(formatNotification);
  const unreadCount = list.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    data: list,
    unreadCount,
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const success = await db.markNotificationAsRead(id, req.user._id);

  res.json({ success, message: success ? 'Notification marked as read.' : 'Notification not found.' });
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const count = await db.markAllNotificationsAsRead(req.user._id);
  res.json({ success: true, count, message: 'All notifications marked as read.' });
}
