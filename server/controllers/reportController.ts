import { Request, Response } from 'express';
import { db } from '../db/store';
import { IReportDocument } from '../db/schema';
import { ReportItem } from '../../src/types';

async function formatReport(doc: IReportDocument): Promise<ReportItem> {
  const reporter = doc.reporterId && doc.reporterId !== 'guest-reporter'
    ? await db.findUserById(doc.reporterId)
    : undefined;
  return {
    id: doc._id,
    reporterId: doc.reporterId,
    reporterName: reporter?.name || 'Anonymous Peer',
    targetType: doc.targetType,
    targetId: doc.targetId,
    reason: doc.reason,
    details: doc.details,
    status: doc.status,
    resolutionNotes: doc.resolutionNotes,
    createdAt: doc.createdAt,
  };
}

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    const reporterId = req.user?._id || 'guest-reporter';
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !reason) {
      res.status(400).json({ success: false, error: 'Target type and reason are required.' });
      return;
    }

    const newReport: IReportDocument = {
      _id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reporterId,
      targetType,
      targetId: targetId || 'general-feedback',
      reason,
      details: details || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const created = await db.createReport(newReport);

    // Notify admins
    const admins = (await db.getAllUsers()).filter((u) => u.role === 'admin');
    await Promise.all(
      admins.map((admin) =>
        db.createNotification({
          _id: `notif-${Date.now()}-${admin._id}`,
          userId: admin._id,
          type: 'system',
          title: `New Report: ${reason}`,
          message: `A new ${targetType} moderation report has been submitted.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json({
      success: true,
      data: await formatReport(created),
      message: 'Your report has been received and escalated to campus moderators.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit report.' });
  }
}

export async function getAdminReports(_req: Request, res: Response): Promise<void> {
  try {
    const reports = await db.getReports();
    const formatted = await Promise.all(reports.map(formatReport));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports.' });
  }
}

export async function resolveReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status || !['RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Valid status (RESOLVED or DISMISSED) required.' });
      return;
    }

    const updated = await db.updateReportStatus(id, status, resolutionNotes);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Report not found.' });
      return;
    }

    await db.createAuditLog({
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId: req.user?._id || 'admin',
      adminName: req.user?.name || 'Administrator',
      action: `REPORT_${status}`,
      targetType: 'REPORT',
      targetId: id,
      targetTitle: updated.reason,
      details: resolutionNotes || `Report marked as ${status}.`,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: await formatReport(updated),
      message: `Report marked as ${status}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update report.' });
  }
}
