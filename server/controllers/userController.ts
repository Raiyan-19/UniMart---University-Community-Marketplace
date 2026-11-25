import { Request, Response } from 'express';
import { db, hashPassword, verifyPassword } from '../db/store';
import { formatUserResponse } from './authController';
import { AdminStats } from '../../src/types';

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  res.json({ success: true, data: await formatUserResponse(req.user) });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const {
    name,
    phone,
    bio,
    avatar,
    departmentId,
    studentId,
    designation,
    currentSemester,
  } = req.body;

  const updates: Record<string, unknown> = {};
  if (name && name.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (bio !== undefined) updates.bio = bio.trim();
  if (avatar) updates.avatar = avatar;
  if (departmentId) {
    const dept = await db.findDepartmentById(departmentId);
    if (dept) updates.departmentId = departmentId;
  }
  if (studentId !== undefined && req.user.role === 'student') updates.studentId = studentId.trim();
  if (designation !== undefined && req.user.role === 'teacher') updates.designation = designation.trim();
  if (currentSemester !== undefined) updates.currentSemester = currentSemester.trim();

  const updatedUser = await db.updateUser(req.user._id, updates);
  if (!updatedUser) {
    res.status(404).json({ success: false, error: 'User record not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: await formatUserResponse(updatedUser),
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    return;
  }

  const isCurrentValid = verifyPassword(currentPassword, req.user.passwordHash, req.user.salt);
  if (!isCurrentValid) {
    res.status(400).json({ success: false, error: 'Incorrect current password.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  await db.updateUser(req.user._id, {
    passwordHash: hash,
    salt,
  });

  res.json({ success: true, message: 'Password has been updated successfully.' });
}

export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const user = await db.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const safeProfile = await formatUserResponse(user);
  res.json({ success: true, data: safeProfile });
}

// Admin Operations
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const [users, universities, departments] = await Promise.all([
    db.getAllUsers(),
    db.getAllUniversities(),
    db.getAllDepartments(),
  ]);
  const univMap = new Map(universities.map((u) => [u._id, u]));
  const deptMap = new Map(departments.map((d) => [d._id, d]));

  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const roleFilter = req.query.role as string;
  const universityFilter = req.query.universityId as string;

  let filtered = users;
  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.studentId && u.studentId.toLowerCase().includes(search))
    );
  }

  if (roleFilter && roleFilter !== 'all') {
    filtered = filtered.filter((u) => u.role === roleFilter);
  }

  if (universityFilter && universityFilter !== 'all') {
    filtered = filtered.filter((u) => u.universityId === universityFilter);
  }

  const data = filtered.map((doc) => {
    const univ = univMap.get(doc.universityId);
    const dept = deptMap.get(doc.departmentId);
    return {
      id: doc._id,
      name: doc.name,
      email: doc.email,
      role: doc.role,
      universityId: doc.universityId,
      universityName: univ?.name,
      universityShortName: univ?.shortName,
      departmentId: doc.departmentId,
      departmentName: dept?.name,
      phone: doc.phone,
      avatar: doc.avatar,
      bio: doc.bio,
      studentId: doc.studentId,
      designation: doc.designation,
      currentSemester: doc.currentSemester,
      isEmailVerified: doc.isEmailVerified,
      isVerified: doc.isVerified,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  });

  res.json({
    success: true,
    data,
    total: data.length,
  });
}

export async function toggleVerifyUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await db.findUserById(id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const newVerifiedState = !user.isVerified;
  const updated = await db.updateUser(id, { isVerified: newVerifiedState });

  if (updated) {
    await db.createNotification({
      _id: `notif-${Date.now()}`,
      userId: id,
      type: 'system',
      title: newVerifiedState ? 'Identity Verified! 🎓' : 'Verification Revoked',
      message: newVerifiedState
        ? 'Your student/teacher university affiliation has been verified by campus admin.'
        : 'Your university verification status has been updated by administration.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    await db.createAuditLog({
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId: req.user?._id || 'admin',
      adminName: req.user?.name || 'Administrator',
      action: newVerifiedState ? 'USER_VERIFIED' : 'USER_VERIFICATION_REVOKED',
      targetType: 'USER',
      targetId: id,
      targetTitle: user.name,
      details: `Verification status changed to ${newVerifiedState ? 'Verified' : 'Unverified'}.`,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: `User status changed to ${newVerifiedState ? 'Verified' : 'Unverified'}.`,
    data: updated ? await formatUserResponse(updated) : undefined,
  });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'pending'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid user status.' });
    return;
  }

  const updated = await db.updateUser(id, { status });
  if (!updated) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  await db.createAuditLog({
    _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminId: req.user?._id || 'admin',
    adminName: req.user?.name || 'Administrator',
    action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    targetType: 'USER',
    targetId: id,
    targetTitle: updated.name,
    details: `User account status set to ${status.toUpperCase()}.`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `User status updated to ${status}.`,
    data: await formatUserResponse(updated),
  });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role.' });
    return;
  }

  const updated = await db.updateUser(id, { role });
  if (!updated) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  await db.createAuditLog({
    _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminId: req.user?._id || 'admin',
    adminName: req.user?.name || 'Administrator',
    action: 'USER_ROLE_CHANGED',
    targetType: 'USER',
    targetId: id,
    targetTitle: updated.name,
    details: `Permissions changed to ${role.toUpperCase()}.`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `User role updated to ${role}.`,
    data: await formatUserResponse(updated),
  });
}

export async function bulkVerifyUsers(req: Request, res: Response): Promise<void> {
  try {
    const { userIds, verify = true } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ success: false, error: 'userIds array is required.' });
      return;
    }

    const updatedUsers: any[] = [];
    for (const uid of userIds) {
      const updated = await db.updateUser(uid, { isVerified: !!verify });
      if (updated) {
        updatedUsers.push(await formatUserResponse(updated));
      }
    }

    await db.createAuditLog({
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId: req.user?._id || 'admin',
      adminName: req.user?.name || 'Administrator',
      action: verify ? 'BULK_USERS_VERIFIED' : 'BULK_USERS_REVOKED',
      targetType: 'USERS',
      details: `Bulk verification updated for ${updatedUsers.length} members.`,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Successfully updated ${updatedUsers.length} users.`,
      data: updatedUsers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Bulk verify failed' });
  }
}

export async function getAuditLogs(_req: Request, res: Response): Promise<void> {
  try {
    const logs = await db.getAuditLogs();
    res.json({
      success: true,
      data: logs.map((l) => ({
        id: l._id,
        adminId: l.adminId,
        adminName: l.adminName,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        targetTitle: l.targetTitle,
        details: l.details,
        createdAt: l.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
}

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  const [users, universities, departments, products, transactions, offers, reports] = await Promise.all([
    db.getAllUsers(),
    db.getAllUniversities(),
    db.getAllDepartments(),
    db.getAllProducts(),
    db.getTransactions(),
    db.getAllOffers(),
    db.getAllReports(),
  ]);

  const stats: AdminStats = {
    totalUsers: users.length,
    totalStudents: users.filter((u) => u.role === 'student').length,
    totalTeachers: users.filter((u) => u.role === 'teacher').length,
    totalAdmins: users.filter((u) => u.role === 'admin').length,
    totalUniversities: universities.length,
    totalDepartments: departments.length,
    pendingVerifications: users.filter((u) => !u.isVerified).length,
    activeListings: products.filter((p) => p.status === 'active').length,
    completedDeals: transactions.length,
    totalOffers: offers.length,
    pendingReports: reports.filter((r) => r.status === 'PENDING' || r.status === 'pending').length,
  };

  res.json({ success: true, data: stats });
}
