import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Award,
  Flag,
  Tag,
  HelpCircle,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Mail,
  FileText,
  AlertCircle,
  Eye,
  Clock,
  Sparkles,
  ShoppingBag,
  Handshake,
  Check,
  Download,
  History,
  BarChart3,
  SlidersHorizontal,
  Package,
  Layers,
  Phone,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  Ban,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import {
  User,
  University,
  Department,
  AdminStats,
  ReportItem,
  GuideItem,
  Product,
  AuditLogItem,
} from '../../types';
import { adminApi, universityApi, reportsApi, guidesApi, productsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useUniversity } from '../../context/UniversityContext';
import { useAuth } from '../../context/AuthContext';

// Helper for Browser CSV Exports
function downloadCSV(rows: (string | number)[][], filename: string) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const AdminDashboard: React.FC = () => {
  const { universities, departments, refreshUniversities } = useUniversity();
  const { success, error, info } = useToast();
  const { user } = useAuth();

  // Tab State
  type AdminTab =
    | 'overview'
    | 'users'
    | 'listings'
    | 'universities'
    | 'departments'
    | 'reports'
    | 'categories'
    | 'guides'
    | 'audit';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Core Data Collections
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [listingsList, setListingsList] = useState<Product[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [guidesList, setGuidesList] = useState<GuideItem[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isListingsLoading, setIsListingsLoading] = useState(false);

  // Filters: User Table & Bulk Actions
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [univFilter, setUnivFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<User | null>(null);

  // Filters: Listings Hub
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all');
  const [listingUnivFilter, setListingUnivFilter] = useState<string>('all');
  const [listingCategoryFilter, setListingCategoryFilter] = useState<string>('all');
  const [selectedListingForPreview, setSelectedListingForPreview] = useState<Product | null>(null);

  // University Modal State
  const [isUnivModalOpen, setIsUnivModalOpen] = useState(false);
  const [editingUniv, setEditingUniv] = useState<University | null>(null);
  const [univSearch, setUnivSearch] = useState('');
  const [univName, setUnivName] = useState('');
  const [univShortName, setUnivShortName] = useState('');
  const [univDomain, setUnivDomain] = useState('');
  const [univLocation, setUnivLocation] = useState('');
  const [univLogo, setUnivLogo] = useState('🏛️');

  // Department Modal State & Filter
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [deptUnivFilter, setDeptUnivFilter] = useState('all');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptUnivId, setDeptUnivId] = useState(universities[0]?.id || 'univ-baust');

  // Moderation / Reports State
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | 'listing' | 'user' | 'service' | 'system'>('ALL');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolvingReport, setIsResolvingReport] = useState(false);

  // Service Categories State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Guides & FAQs State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideItem | null>(null);
  const [previewingGuide, setPreviewingGuide] = useState<GuideItem | null>(null);
  const [guideCategoryFilter, setGuideCategoryFilter] = useState<'all' | 'freshers' | 'trade' | 'safety' | 'faq'>('all');
  const [guideSearch, setGuideSearch] = useState('');
  const [guideCategory, setGuideCategory] = useState<'freshers' | 'trade' | 'safety' | 'faq'>('freshers');
  const [guideTitle, setGuideTitle] = useState('');
  const [guideSummary, setGuideSummary] = useState('');
  const [guideContent, setGuideContent] = useState('');

  // Audit Logs State & Filters
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // 1. Load Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // 2. Load Users
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAllUsers({
        search: userSearch,
        role: roleFilter,
        universityId: univFilter,
      });
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (err: any) {
      error('Failed to load users', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userSearch, roleFilter, univFilter, error]);

  // 3. Load Listings
  const loadListings = useCallback(async () => {
    try {
      setIsListingsLoading(true);
      const res = await adminApi.getAllListings({
        search: listingSearch,
        status: listingStatusFilter,
        universityId: listingUnivFilter,
        category: listingCategoryFilter,
      });
      if (res.success && res.data) {
        setListingsList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load listings for moderation:', err);
    } finally {
      setIsListingsLoading(false);
    }
  }, [listingSearch, listingStatusFilter, listingUnivFilter, listingCategoryFilter]);

  // 4. Load Reports
  const loadReports = useCallback(async () => {
    try {
      const res = await reportsApi.getAdminReports();
      if (res.success && res.data) {
        setReportsList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    }
  }, []);

  // 5. Load Service Categories
  const loadServiceCategories = useCallback(async () => {
    try {
      const res = await adminApi.getServiceCategories();
      if (res.success && res.data) {
        setServiceCategories(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // 6. Load Guides
  const loadGuides = useCallback(async () => {
    try {
      const res = await guidesApi.getAll();
      if (res.success && res.data) {
        setGuidesList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load guides:', err);
    }
  }, []);

  // 7. Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await adminApi.getAuditLogs();
      if (res.success && res.data) {
        setAuditLogsList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    }
  }, []);

  // Sync All Data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadListings(),
      loadReports(),
      loadServiceCategories(),
      loadGuides(),
      loadAuditLogs(),
      refreshUniversities(),
    ]);
    setIsRefreshing(false);
    success('Dashboard Refreshed', 'All campus statistics and live records are up to date.');
  };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadListings();
    loadReports();
    loadServiceCategories();
    loadGuides();
    loadAuditLogs();
  }, [loadStats, loadUsers, loadListings, loadReports, loadServiceCategories, loadGuides, loadAuditLogs]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUnivModalOpen(false);
        setIsDeptModalOpen(false);
        setIsGuideModalOpen(false);
        setSelectedReport(null);
        setPreviewingGuide(null);
        setSelectedUserForDossier(null);
        setSelectedListingForPreview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (verificationFilter === 'verified' && !u.isVerified) return false;
      if (verificationFilter === 'pending' && u.isVerified) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [usersList, verificationFilter, statusFilter]);

  // Filtered Listings List
  const filteredListings = useMemo(() => {
    return listingsList.filter((p) => {
      if (listingStatusFilter !== 'all' && p.status !== listingStatusFilter) return false;
      if (listingUnivFilter !== 'all' && p.universityId !== listingUnivFilter) return false;
      if (listingCategoryFilter !== 'all' && p.category.toLowerCase() !== listingCategoryFilter.toLowerCase()) return false;
      if (listingSearch.trim()) {
        const q = listingSearch.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sellerName && p.sellerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [listingsList, listingStatusFilter, listingUnivFilter, listingCategoryFilter, listingSearch]);

  // Filtered Universities
  const filteredUniversities = useMemo(() => {
    if (!univSearch.trim()) return universities;
    const q = univSearch.toLowerCase();
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.domain.toLowerCase().includes(q) ||
        (u.location && u.location.toLowerCase().includes(q))
    );
  }, [universities, univSearch]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      if (deptUnivFilter !== 'all' && dept.universityId !== deptUnivFilter) return false;
      if (deptSearch.trim()) {
        const q = deptSearch.toLowerCase();
        return dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [departments, deptUnivFilter, deptSearch]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reportsList.filter((rep) => {
      if (reportStatusFilter !== 'ALL' && rep.status.toUpperCase() !== reportStatusFilter) return false;
      if (reportTypeFilter !== 'ALL' && rep.targetType !== reportTypeFilter) return false;
      return true;
    });
  }, [reportsList, reportStatusFilter, reportTypeFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return serviceCategories;
    return serviceCategories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [serviceCategories, categorySearch]);

  // Filtered Guides
  const filteredGuides = useMemo(() => {
    return guidesList.filter((g) => {
      if (guideCategoryFilter !== 'all' && g.category !== guideCategoryFilter) return false;
      if (guideSearch.trim()) {
        const q = guideSearch.toLowerCase();
        return g.title.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q);
      }
      return true;
    });
  }, [guidesList, guideCategoryFilter, guideSearch]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogsList.filter((l) => {
      if (auditActionFilter !== 'ALL' && !l.action.startsWith(auditActionFilter)) return false;
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        return (
          l.action.toLowerCase().includes(q) ||
          (l.targetTitle && l.targetTitle.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q)) ||
          l.adminName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogsList, auditActionFilter, auditSearch]);

  // Pending reports count
  const pendingReportsCount = useMemo(() => {
    return reportsList.filter((r) => r.status.toUpperCase() === 'PENDING').length;
  }, [reportsList]);

  // Campus User Distribution for SVG Chart
  const campusStatsData = useMemo(() => {
    return universities.map((u) => {
      const count = usersList.filter((user) => user.universityId === u.id).length;
      return {
        id: u.id,
        shortName: u.shortName,
        name: u.name,
        count,
      };
    });
  }, [universities, usersList]);

  // Category Distribution for SVG Chart
  const categoryStatsData = useMemo(() => {
    const counts: Record<string, number> = {};
    listingsList.forEach((p) => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [listingsList]);

  // User Verification Toggle
  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await adminApi.toggleVerify(userId);
      if (res.success && res.data) {
        success(
          'Verification Updated',
          currentStatus ? 'User verification revoked.' : 'User identity successfully verified.'
        );
        setUsersList((prev) => prev.map((u) => (u.id === userId ? res.data! : u)));
        if (selectedUserForDossier?.id === userId) {
          setSelectedUserForDossier(res.data);
        }
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Action Failed', err.message);
    }
  };

  // Bulk Verification
  const handleBulkVerify = async (verify: boolean) => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await adminApi.bulkVerifyUsers(selectedUserIds, verify);
      if (res.success && res.data) {
        success('Bulk Verification', `Updated verification status for ${res.data.length} users.`);
        const updatedMap = new Map(res.data.map((u) => [u.id, u]));
        setUsersList((prev) => prev.map((u) => updatedMap.get(u.id) || u));
        setSelectedUserIds([]);
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Bulk Action Failed', err.message);
    }
  };

  // User Status Toggle (Suspend / Activate)
  const handleToggleStatus = async (userToUpdate: User) => {
    const nextStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
    if (nextStatus === 'suspended') {
      const confirmed = window.confirm(
        `Are you sure you want to suspend "${userToUpdate.name}"? They will lose access to buying, selling, and messaging.`
      );
      if (!confirmed) return;
    }
    try {
      const res = await adminApi.updateStatus(userToUpdate.id, nextStatus);
      if (res.success && res.data) {
        success('Status Changed', `User account is now ${nextStatus.toUpperCase()}.`);
        setUsersList((prev) => prev.map((u) => (u.id === userToUpdate.id ? res.data! : u)));
        if (selectedUserForDossier?.id === userToUpdate.id) {
          setSelectedUserForDossier(res.data);
        }
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Action Failed', err.message);
    }
  };

  // User Role Change
  const handleRoleChange = async (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    try {
      const res = await adminApi.updateRole(userId, newRole);
      if (res.success && res.data) {
        success('Role Updated', `User permissions changed to ${newRole.toUpperCase()}.`);
        setUsersList((prev) => prev.map((u) => (u.id === userId ? res.data! : u)));
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Role Change Failed', err.message);
    }
  };

  // Listing Moderation: Toggle Status
  const handleToggleListingStatus = async (listing: Product) => {
    const nextStatus = listing.status === 'active' ? 'suspended' : 'active';
    let reason = '';
    if (nextStatus === 'suspended') {
      reason = prompt('Enter moderation reason for suspending this listing:', 'Content policy violation / safety review') || 'Administrative review';
    }
    try {
      const res = await adminApi.updateListingStatus(listing.id, nextStatus as any, reason);
      if (res.success) {
        success('Listing Updated', `Listing is now marked as ${nextStatus.toUpperCase()}.`);
        setListingsList((prev) => prev.map((p) => (p.id === listing.id ? { ...p, status: nextStatus as any } : p)));
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Moderation Failed', err.message);
    }
  };

  // Listing Moderation: Delete Listing
  const handleDeleteListing = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete listing "${title}"? This cannot be undone.`)) return;
    try {
      const res = await adminApi.deleteListing(id);
      if (res.success) {
        success('Listing Deleted', `"${title}" has been removed from campus listings.`);
        setListingsList((prev) => prev.filter((p) => p.id !== id));
        if (selectedListingForPreview?.id === id) {
          setSelectedListingForPreview(null);
        }
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  // University Save
  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUniv) {
        const res = await universityApi.updateUniversity(editingUniv.id, {
          name: univName.trim(),
          shortName: univShortName.trim().toUpperCase(),
          domain: univDomain.trim().toLowerCase(),
          location: univLocation.trim(),
          logo: univLogo.trim() || '🏛️',
        });
        if (res.success) {
          success('University Updated', `${univShortName} campus profile updated.`);
        }
      } else {
        const res = await universityApi.createUniversity({
          name: univName.trim(),
          shortName: univShortName.trim().toUpperCase(),
          domain: univDomain.trim().toLowerCase(),
          location: univLocation.trim(),
          logo: univLogo.trim() || '🏛️',
        });
        if (res.success) {
          success('University Added', `${univShortName} successfully integrated into UniMart.`);
        }
      }
      setIsUnivModalOpen(false);
      setEditingUniv(null);
      refreshUniversities();
      loadStats();
      loadAuditLogs();
    } catch (err: any) {
      error('University Error', err.message);
    }
  };

  // Delete University
  const handleDeleteUniversity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" and all its linked departments? This action cannot be undone.`)) return;
    try {
      const res = await universityApi.deleteUniversity(id);
      if (res.success) {
        success('Campus Removed', `${name} has been removed from active registries.`);
        refreshUniversities();
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  // Department Save
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const res = await universityApi.updateDepartment(editingDept.id, {
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
        });
        if (res.success) {
          success('Department Updated', `${deptCode} updated successfully.`);
        }
      } else {
        const res = await universityApi.createDepartment({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          universityId: deptUnivId,
        });
        if (res.success) {
          success('Department Created', `${deptCode} department added.`);
        }
      }
      setIsDeptModalOpen(false);
      setEditingDept(null);
      refreshUniversities();
      loadStats();
      loadAuditLogs();
    } catch (err: any) {
      error('Department Error', err.message);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove department "${name}"?`)) return;
    try {
      const res = await universityApi.deleteDepartment(id);
      if (res.success) {
        success('Department Removed', `${name} deleted.`);
        refreshUniversities();
        loadStats();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  // Moderation Resolution
  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      setIsResolvingReport(true);
      await reportsApi.resolveReport(
        reportId,
        status,
        resolutionNotes.trim() || `Processed as ${status} by Administrator.`
      );
      success('Report Updated', `Report successfully marked as ${status}.`);
      setSelectedReport(null);
      setResolutionNotes('');
      loadReports();
      loadStats();
      loadAuditLogs();
    } catch (err: any) {
      error('Report Update Failed', err.message);
    } finally {
      setIsResolvingReport(false);
    }
  };

  // Service Category Add
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setIsAddingCategory(true);
      const res = await adminApi.addServiceCategory(newCategoryName.trim());
      if (res.success && res.data) {
        setServiceCategories(res.data);
        setNewCategoryName('');
        success('Category Added', `Service category "${newCategoryName.trim()}" is now live.`);
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Failed to Add', err.message || 'Error adding category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Service Category Delete
  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Are you sure you want to remove category "${catName}"?`)) return;
    try {
      const res = await adminApi.deleteServiceCategory(catName);
      if (res.success && res.data) {
        setServiceCategories(res.data);
        success('Category Removed', `Category "${catName}" has been removed.`);
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Failed to Remove', err.message || 'Error removing category');
    }
  };

  // Guide Save
  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideTitle.trim() || !guideSummary.trim() || !guideContent.trim()) {
      error('Missing Information', 'Please fill in title, summary, and content.');
      return;
    }
    try {
      if (editingGuide) {
        const res = await guidesApi.update(editingGuide.id, {
          category: guideCategory,
          title: guideTitle.trim(),
          summary: guideSummary.trim(),
          content: guideContent.trim(),
        });
        if (res.success) {
          success('Guide Updated', `"${guideTitle.trim()}" updated successfully.`);
        }
      } else {
        const res = await guidesApi.create({
          category: guideCategory,
          title: guideTitle.trim(),
          summary: guideSummary.trim(),
          content: guideContent.trim(),
          order: guidesList.length + 1,
        });
        if (res.success) {
          success('Guide Published', `Campus guide published for students.`);
        }
      }
      setIsGuideModalOpen(false);
      setEditingGuide(null);
      loadGuides();
      loadAuditLogs();
    } catch (err: any) {
      error('Action Failed', err.message || 'Error saving guide');
    }
  };

  // Guide Delete
  const handleDeleteGuide = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove guide "${title}"?`)) return;
    try {
      const res = await guidesApi.delete(id);
      if (res.success) {
        success('Guide Deleted', `"${title}" has been removed.`);
        loadGuides();
        loadAuditLogs();
      }
    } catch (err: any) {
      error('Failed to Delete', err.message || 'Error deleting guide');
    }
  };

  // CSV Export Handlers
  const handleExportUsersCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Campus', 'Department', 'Student / Faculty ID', 'Verified', 'Account Status', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role.toUpperCase(),
      u.universityShortName || 'BAUST',
      u.departmentName || 'General',
      u.studentId || u.designation || 'N/A',
      u.isVerified ? 'VERIFIED' : 'PENDING',
      u.status.toUpperCase(),
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    downloadCSV([headers, ...rows], `unimart_campus_members_${Date.now()}.csv`);
    info('Download Started', 'Campus members CSV file generated.');
  };

  const handleExportListingsCSV = () => {
    const headers = ['Listing ID', 'Title', 'Category', 'Price (BDT)', 'Condition', 'Campus', 'Seller Name', 'Status', 'Views', 'Saves', 'Listed Date'];
    const rows = filteredListings.map((p) => [
      p.id,
      p.title,
      p.category,
      p.price,
      p.condition,
      p.universityId,
      p.sellerName || 'Campus Seller',
      p.status.toUpperCase(),
      p.views || 0,
      p.saves || 0,
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    downloadCSV([headers, ...rows], `unimart_campus_listings_${Date.now()}.csv`);
    info('Download Started', 'Listings CSV file generated.');
  };

  const handleExportReportsCSV = () => {
    const headers = ['Report ID', 'Reporter', 'Target Type', 'Target ID', 'Reason', 'Details', 'Status', 'Resolution Notes', 'Date Logged'];
    const rows = filteredReports.map((r) => [
      r.id,
      r.reporterName || 'Anonymous',
      r.targetType.toUpperCase(),
      r.targetId,
      r.reason,
      r.details || '',
      r.status.toUpperCase(),
      r.resolutionNotes || '',
      new Date(r.createdAt).toLocaleString(),
    ]);
    downloadCSV([headers, ...rows], `unimart_moderation_reports_${Date.now()}.csv`);
    info('Download Started', 'Moderation audit CSV generated.');
  };

  // Non-admin guard check
  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Administration Access</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Admin Console requires verified administrator privileges. Your current role is{' '}
          <span className="font-bold text-rose-700 capitalize">{user.role}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP COMMAND CENTER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Enterprise Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.4 Production</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Campus Ecosystem & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Multi-university verification, listings control, safety incident resolution, and campus commerce governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {/* Quick CSV Export Menu Button */}
          <button
            type="button"
            onClick={handleExportUsersCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-emerald-600/40"
            title="Download full community roster as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-semibold backdrop-blur-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Reload all statistics and live records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. MODERN 9-TAB OPERATIONAL SWITCHER */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none flex-nowrap py-0.5">
          {/* Overview */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Pulse</span>
          </button>

          {/* Users */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community Directory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'users' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {usersList.length}
            </span>
          </button>

          {/* Listings Moderation Hub */}
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Listings Control</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'listings' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {listingsList.length}
            </span>
          </button>

          {/* Universities */}
          <button
            type="button"
            onClick={() => setActiveTab('universities')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'universities'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Campuses</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'universities' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {universities.length}
            </span>
          </button>

          {/* Departments */}
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Departments</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'departments' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {departments.length}
            </span>
          </button>

          {/* Moderation Reports */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flag className={`w-4 h-4 ${pendingReportsCount > 0 ? 'text-rose-500' : ''}`} />
            <span>Moderation</span>
            {pendingReportsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                {pendingReportsCount}
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  activeTab === 'reports' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {reportsList.length}
              </span>
            )}
          </button>

          {/* Service Categories */}
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categories</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'categories' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {serviceCategories.length}
            </span>
          </button>

          {/* Guides & FAQs */}
          <button
            type="button"
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'guides'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guides</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'guides' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {guidesList.length}
            </span>
          </button>

          {/* Security & Audit Trail */}
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'audit' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {auditLogsList.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. TAB 1: OVERVIEW & CAMPUS PULSE */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Executive KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Users */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Members</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalUsers}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Total community</p>
            </div>

            {/* Students */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Students</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalStudents}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Active learners</p>
            </div>

            {/* Faculty / Teachers */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faculty</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalTeachers}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Teachers & staff</p>
            </div>

            {/* Universities */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campuses</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalUniversities}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Active registries</p>
            </div>

            {/* Departments */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Departments</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalDepartments}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Academic units</p>
            </div>

            {/* Pending ID Verifications */}
            <div
              className={`p-4 rounded-3xl border transition-all ${
                stats.pendingVerifications > 0
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-300 shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    stats.pendingVerifications > 0 ? 'text-amber-800 font-extrabold' : 'text-slate-500'
                  }`}
                >
                  Pending IDs
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    stats.pendingVerifications > 0
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p
                className={`text-2xl font-black tabular-nums ${
                  stats.pendingVerifications > 0 ? 'text-amber-950' : 'text-slate-900'
                }`}
              >
                {stats.pendingVerifications}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">Awaiting review</p>
            </div>
          </div>

          {/* Secondary Marketplace Pulse Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Active Listings
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">{stats.activeListings || 0}</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-blue-600" /> Completed Deals
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">{stats.completedDeals || 0}</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> Total Offers
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">{stats.totalOffers || 0}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs ${
                pendingReportsCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Flag className={`w-4 h-4 ${pendingReportsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                Flagged Reports
              </span>
              <span className="text-sm font-extrabold tabular-nums">{pendingReportsCount}</span>
            </div>
          </div>

          {/* Interactive Campus Analytics & Charts (Pure SVG - zero heavy packages) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campus Community Share Bar Chart */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Campus Membership Share</h3>
                  <p className="text-[11px] text-slate-500">Distribution of enrolled students and faculty by campus</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportUsersCSV}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition"
                  title="Export Roster CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {campusStatsData.map((c) => {
                  const maxCount = Math.max(...campusStatsData.map((item) => item.count), 1);
                  const percentage = Math.round((c.count / maxCount) * 100);
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{c.shortName} <span className="text-[10px] text-slate-400 font-normal">({c.name})</span></span>
                        <span className="text-emerald-800 font-bold">{c.count} members</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Listing Share Visual */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Marketplace Category Breakdown</h3>
                  <p className="text-[11px] text-slate-500">Active student product supply across campus departments</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportListingsCSV}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition"
                  title="Export Listings CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {categoryStatsData.slice(0, 5).map((cat) => {
                  const maxCat = Math.max(...categoryStatsData.map((c) => c.count), 1);
                  const percentage = Math.round((cat.count / maxCat) * 100);
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{cat.name}</span>
                        <span className="text-indigo-800 font-bold">{cat.count} listings</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Command Shortcuts Strip */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-5 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Immediate Administrative Workflows</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct shortcuts to review pending student verification or audit live campus items.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('users');
                  setVerificationFilter('pending');
                }}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                Review Pending IDs ({stats.pendingVerifications})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Inspect Listings Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: COMMUNITY DIRECTORY WITH BULK ACTIONS & USER DOSSIER */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, student/faculty ID, or email..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all shadow-inner"
                />
                {userSearch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="student">🎓 Students Only</option>
                  <option value="teacher">🧑‍🏫 Faculty / Teachers</option>
                  <option value="admin">🛡️ System Admins</option>
                </select>

                <select
                  value={univFilter}
                  onChange={(e) => setUnivFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Universities</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shortName} - {u.name}
                    </option>
                  ))}
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified Only (✓)</option>
                  <option value="pending">Pending Review (?)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Accounts</option>
                  <option value="suspended">Suspended Accounts</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportUsersCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Export filtered users to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Results Counter and Selection Status */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <p>
                Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> registered members
              </p>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Tip: Click on any member row to inspect their 360° user dossier.
              </div>
            </div>
          </div>

          {/* Sticky Floating Bulk Action Bar when rows are selected */}
          {selectedUserIds.length > 0 && (
            <div className="mx-4 p-3 bg-emerald-900 text-white rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in-50">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{selectedUserIds.length} members selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkVerify(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Verify Selected (✓)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkVerify(false)}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Revoke Verification
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Responsive Scroll Hint for Mobile */}
          <div className="block lg:hidden px-4 text-[11px] font-medium text-slate-400 flex items-center justify-between bg-slate-50 py-1.5">
            <span>← Swipe horizontally to view full table details →</span>
            <span>{filteredUsers.length} entries</span>
          </div>

          {/* User Table with explicit min-w */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(filteredUsers.map((u) => u.id));
                        } else {
                          setSelectedUserIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Academic Role</th>
                  <th className="px-4 py-3">Campus & Dept</th>
                  <th className="px-4 py-3">Student / Faculty ID</th>
                  <th className="px-4 py-3">ID Verification</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Moderator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading community records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No members match your search criteria</p>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting your search query, role filter, or university campus selection.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => {
                            setSelectedUserIds((prev) =>
                              prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Member Info (Click to open 360 dossier) */}
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => setSelectedUserForDossier(u)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart'}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallbackApplied) {
                                target.dataset.fallbackApplied = 'true';
                                target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart';
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug truncate group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-600" />
                            </p>
                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="px-4 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as 'student' | 'teacher' | 'admin')
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border border-slate-200 focus:outline-none capitalize transition-colors cursor-pointer"
                        >
                          <option value="student">🎓 Student</option>
                          <option value="teacher">🧑‍🏫 Teacher</option>
                          <option value="admin">🛡️ Admin</option>
                        </select>
                      </td>

                      {/* Campus & Dept */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{u.universityShortName || 'BAUST'}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {u.departmentName || 'General Faculty'}
                        </p>
                      </td>

                      {/* ID / Designation */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {u.studentId || u.designation || '—'}
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-3.5">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(u.id, u.isVerified)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${
                              u.isVerified
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            {u.isVerified ? 'Revoke ID' : 'Verify ID'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: LISTINGS MODERATION & CONTROL HUB */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Search listings by title, seller, or description..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all shadow-inner"
                />
                {listingSearch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setListingSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active (Visible)</option>
                  <option value="suspended">Suspended / Under Review</option>
                  <option value="sold">Sold Items</option>
                </select>

                <select
                  value={listingUnivFilter}
                  onChange={(e) => setListingUnivFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Campuses</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shortName}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportListingsCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Export Listings to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <p>
                Showing <span className="font-bold text-slate-900">{filteredListings.length}</span> campus listings
              </p>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Admins have full authority to suspend policy-violating items or purge spam.
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isListingsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading campus listings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No listings match the selected filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Item Details */}
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => setSelectedListingForPreview(p)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-xs">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              Condition: <span className="text-slate-600 font-medium">{p.condition}</span> · Location: {p.location || 'Campus'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 whitespace-nowrap">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-extrabold text-emerald-800 tabular-nums">
                        ৳ {p.price.toLocaleString()}
                      </td>

                      {/* Seller */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{p.sellerName || 'Student'}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{p.sellerType || 'Student'}</p>
                      </td>

                      {/* Views & Saves */}
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] tabular-nums whitespace-nowrap">
                        👁️ {p.views || 0} · 🔖 {p.saves || 0}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'suspended'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'active' ? 'bg-emerald-500' : p.status === 'suspended' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Moderation Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleListingStatus(p)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-2xs cursor-pointer ${
                              p.status === 'active'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            {p.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteListing(p.id, p.title)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 4: UNIVERSITIES REGISTRY */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Supported Campus Network</h2>
              <p className="text-xs text-slate-500">
                Multi-university registry. Every integrated university supports automatic student email validation and faculty access.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={univSearch}
                  onChange={(e) => setUnivSearch(e.target.value)}
                  placeholder="Search campuses..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingUniv(null);
                  setUnivName('');
                  setUnivShortName('');
                  setUnivDomain('');
                  setUnivLocation('');
                  setUnivLogo('🏛️');
                  setIsUnivModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add University</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUniversities.map((univ) => {
              const deptCount = departments.filter((d) => d.universityId === univ.id).length;
              return (
                <div
                  key={univ.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                          {univ.logo || '🏛️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">{univ.shortName}</h3>
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-mono font-bold">
                              @{univ.domain}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">{univ.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUniv(univ);
                            setUnivName(univ.name);
                            setUnivShortName(univ.shortName);
                            setUnivDomain(univ.domain);
                            setUnivLocation(univ.location || '');
                            setUnivLogo(univ.logo || '🏛️');
                            setIsUnivModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit University"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUniversity(univ.id, univ.shortName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete University"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{univ.location || 'Bangladesh'}</span>
                      </span>

                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold text-[11px]">
                        <strong className="text-emerald-800 font-extrabold">{deptCount}</strong> Departments
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. TAB 5: ACADEMIC DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Academic Department Directory</h2>
              <p className="text-xs text-slate-500">
                Manage all academic branches mapped to universities for course materials and departmental exchanges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptUnivFilter}
                onChange={(e) => setDeptUnivFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.shortName}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Search code or name..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingDept(null);
                  setDeptName('');
                  setDeptCode('');
                  setDeptUnivId(universities[0]?.id || 'univ-baust');
                  setIsDeptModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Department Name</th>
                    <th className="px-4 py-3">Academic Code</th>
                    <th className="px-4 py-3">Campus Affiliation</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No departments found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept) => {
                      const univ = universities.find((u) => u.id === dept.universityId);
                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{dept.name}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
                              {dept.code}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">
                            {univ?.name} ({univ?.shortName || dept.universityId})
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDept(dept);
                                  setDeptName(dept.name);
                                  setDeptCode(dept.code);
                                  setDeptUnivId(dept.universityId);
                                  setIsDeptModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                title="Edit Department"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 6: CONTENT MODERATION & INCIDENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Safety & Marketplace Moderation Center
              </h2>
              <p className="text-xs text-slate-500">
                Inspect user reports against listings, inappropriate behavior, or prohibited items across campuses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setReportStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reportStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  All ({reportsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    reportStatusFilter === 'PENDING'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Pending ({reportsList.filter((r) => r.status.toUpperCase() === 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportStatusFilter('RESOLVED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reportStatusFilter === 'RESOLVED' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setReportStatusFilter('DISMISSED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    reportStatusFilter === 'DISMISSED' ? 'bg-white text-slate-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Dismissed
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportReportsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Export Reports to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Target Scope</th>
                    <th className="px-4 py-3">Report Reason</th>
                    <th className="px-4 py-3">Description Snippet</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action / Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{rep.reporterName || 'Anonymous Campus User'}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                          {rep.targetType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{rep.reason}</td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={rep.details}>
                        {rep.details || 'No additional notes provided.'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            rep.status.toUpperCase() === 'PENDING'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rep.status.toUpperCase() === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rep.status.toUpperCase() === 'PENDING'
                                ? 'bg-rose-500'
                                : rep.status.toUpperCase() === 'RESOLVED'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {rep.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(rep);
                            setResolutionNotes(rep.resolutionNotes || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold text-slate-800">All clear! No reports in this queue.</p>
                        <p className="text-[11px] text-slate-400">Campus listings and interactions are healthy.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 7: SERVICE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Campus Skill & Service Categories</h2>
              <p className="text-xs text-slate-500">
                Categories available for students and faculty to offer peer tutoring, design, coding, photography, or gadget repair.
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200 self-start sm:self-auto">
              {serviceCategories.length} Live Categories
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new service category (e.g. Photography, Gadget Repair, Peer Tutoring)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingCategory || !newCategoryName.trim()}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative max-w-xs flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <span className="text-[11px] text-slate-400">Total: {filteredCategories.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Category Title</th>
                    <th className="px-4 py-3">Marketplace Availability</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((cat, idx) => (
                    <tr key={cat} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{cat}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100">
                          Active on Services Hub
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="px-2.5 py-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition inline-flex items-center gap-1 font-semibold cursor-pointer"
                          title="Remove Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No service categories match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 10. TAB 8: GUIDES & FAQS */}
      {activeTab === 'guides' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Campus Guides & Student FAQ Authoring</h2>
              <p className="text-xs text-slate-500">
                Publish trusted guidelines on meeting spots, safe trading, graduation sales, and freshman orientation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingGuide(null);
                setGuideCategory('freshers');
                setGuideTitle('');
                setGuideSummary('');
                setGuideContent('');
                setIsGuideModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Guide</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Guides' },
                  { id: 'freshers', label: 'Freshers Hub' },
                  { id: 'trade', label: 'Trading Rules' },
                  { id: 'safety', label: 'Campus Safety' },
                  { id: 'faq', label: 'FAQs' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGuideCategoryFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    guideCategoryFilter === tab.id
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                placeholder="Search guide title..."
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Title & Summary</th>
                    <th className="px-4 py-3">Last Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuides.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {g.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-xs">{g.title}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{g.summary}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(g.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewingGuide(g)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Preview Guide"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGuide(g);
                              setGuideCategory(g.category);
                              setGuideTitle(g.title);
                              setGuideSummary(g.summary);
                              setGuideContent(g.content);
                              setIsGuideModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Guide"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGuide(g.id, g.title)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Guide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGuides.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No guides found. Click "Publish New Guide" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. TAB 9: SECURITY & ADMINISTRATIVE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Administrative Security & Activity Trail</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable audit records tracking verification updates, suspensions, moderations, and registry changes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="USER">User Operations</option>
                  <option value="LISTING">Listing Moderation</option>
                  <option value="REPORT">Report Resolutions</option>
                  <option value="SYSTEM">System Events</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Admin Operator</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Activity Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-sans">
                      No audit activity logged matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap font-sans">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 font-sans">
                        {log.adminName}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action.includes('VERIFIED')
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action.includes('SUSPENDED') || log.action.includes('DELETED')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 font-sans">
                        {log.targetTitle || log.targetType}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-sans max-w-sm truncate" title={log.details}>
                        {log.details || 'Administrative operation completed.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 12. MODALS & POPUPS */}

      {/* MODAL: 360° USER DOSSIER MODAL */}
      {selectedUserForDossier && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedUserForDossier(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForDossier.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart'}
                  alt={selectedUserForDossier.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-600 shrink-0"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{selectedUserForDossier.name}</span>
                    {selectedUserForDossier.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUserForDossier.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDossier(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Campus</p>
                  <p className="font-bold text-slate-800">{selectedUserForDossier.universityShortName || 'BAUST'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
                  <p className="font-bold text-slate-800">{selectedUserForDossier.departmentName || 'General'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">ID / Designation</p>
                  <p className="font-mono text-slate-800">{selectedUserForDossier.studentId || selectedUserForDossier.designation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Account Status</p>
                  <p className={`font-bold capitalize ${selectedUserForDossier.status === 'active' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedUserForDossier.status}
                  </p>
                </div>
              </div>

              {selectedUserForDossier.phone && (
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedUserForDossier.phone}</span>
                </div>
              )}

              {/* Items Posted By This User */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-700">Marketplace Activity</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-base font-extrabold text-emerald-900">
                      {listingsList.filter((p) => p.sellerId === selectedUserForDossier.id).length}
                    </p>
                    <p className="text-[10px] text-emerald-700">Active Listings</p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <p className="text-base font-extrabold text-indigo-900">
                      {new Date(selectedUserForDossier.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-indigo-700">Member Since</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleVerify(selectedUserForDossier.id, selectedUserForDossier.isVerified)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedUserForDossier.isVerified
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {selectedUserForDossier.isVerified ? 'Revoke Verification' : 'Verify Identity'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUserForDossier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedUserForDossier.status === 'active'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedUserForDossier.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LISTING MODERATION PREVIEW */}
      {selectedListingForPreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedListingForPreview(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {selectedListingForPreview.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedListingForPreview.title}</h3>
                <p className="text-xs font-black text-emerald-800 mt-0.5">৳ {selectedListingForPreview.price.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingForPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Product Image */}
              {selectedListingForPreview.images?.[0] && (
                <img
                  src={selectedListingForPreview.images[0]}
                  alt={selectedListingForPreview.title}
                  className="w-full h-44 object-cover rounded-2xl border border-slate-200"
                />
              )}

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Item Description</p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                  {selectedListingForPreview.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-700">
                <p><strong>Condition:</strong> {selectedListingForPreview.condition}</p>
                <p><strong>Campus:</strong> {selectedListingForPreview.universityId}</p>
                <p><strong>Views:</strong> {selectedListingForPreview.views || 0}</p>
                <p><strong>Saves:</strong> {selectedListingForPreview.saves || 0}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteListing(selectedListingForPreview.id, selectedListingForPreview.title)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition"
                >
                  Purge Listing
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleListingStatus(selectedListingForPreview)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                    selectedListingForPreview.status === 'active'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {selectedListingForPreview.status === 'active' ? 'Suspend Listing' : 'Approve & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNIVERSITY ADD / EDIT */}
      {isUnivModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsUnivModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUniv ? 'Edit Campus Profile' : 'Integrate New University'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUnivModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUniversity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full University Name *</label>
                <input
                  type="text"
                  required
                  value={univName}
                  onChange={(e) => setUnivName(e.target.value)}
                  placeholder="e.g. Bangladesh Army University of Science and Technology"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    value={univShortName}
                    onChange={(e) => setUnivShortName(e.target.value)}
                    placeholder="e.g. BAUST"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Domain *</label>
                  <input
                    type="text"
                    required
                    value={univDomain}
                    onChange={(e) => setUnivDomain(e.target.value)}
                    placeholder="e.g. baust.edu.bd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 lowercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  value={univLocation}
                  onChange={(e) => setUnivLocation(e.target.value)}
                  placeholder="e.g. Saidpur Cantonment, Nilphamari"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emblem Emoji / Logo Symbol</label>
                <input
                  type="text"
                  value={univLogo}
                  onChange={(e) => setUnivLogo(e.target.value)}
                  placeholder="e.g. 🏛️ or 🎓"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUnivModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  {editingUniv ? 'Update Campus' : 'Save University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEPARTMENT ADD / EDIT */}
      {isDeptModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsDeptModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingDept ? 'Edit Academic Department' : 'Add New Department'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Associated University *</label>
                <select
                  disabled={!!editingDept}
                  value={deptUnivId}
                  onChange={(e) => setDeptUnivId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shortName} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. CSE"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODERATION REPORT REVIEW */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Incident Review</h3>
                  <p className="text-[10px] text-slate-400">Report ID: {selectedReport.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Reporter</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedReport.reporterName || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Target Type</p>
                  <p className="font-bold text-slate-800 uppercase mt-0.5">{selectedReport.targetType}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Date Logged</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                  <p className="font-extrabold text-rose-700 mt-0.5">{selectedReport.status}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Reason Stated</p>
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                  {selectedReport.reason}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Full Detailed Explanation</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                  {selectedReport.details || 'No additional commentary provided by reporter.'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Administrator Resolution Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record why this was resolved or dismissed for audit logs..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isResolvingReport}
                    onClick={() => handleResolveReport(selectedReport.id, 'DISMISSED')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Dismiss Report
                  </button>
                  <button
                    type="button"
                    disabled={isResolvingReport}
                    onClick={() => handleResolveReport(selectedReport.id, 'RESOLVED')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GUIDE ADD / EDIT */}
      {isGuideModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsGuideModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingGuide ? 'Edit Student Guide' : 'Publish New Campus Guide'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuide} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category *</label>
                <select
                  value={guideCategory}
                  onChange={(e) => setGuideCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="freshers">Freshers Hub (Getting Started)</option>
                  <option value="trade">Buying & Selling Rules</option>
                  <option value="safety">Campus Safety & Meeting Spots</option>
                  <option value="faq">General FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guide Headline Title *</label>
                <input
                  type="text"
                  required
                  value={guideTitle}
                  onChange={(e) => setGuideTitle(e.target.value)}
                  placeholder="e.g. Approved Meeting Spots in Central Library"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Teaser Summary *</label>
                <input
                  type="text"
                  required
                  value={guideSummary}
                  onChange={(e) => setGuideSummary(e.target.value)}
                  placeholder="Brief one-line summary for student previews..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Detailed Guidelines *</label>
                <textarea
                  rows={5}
                  required
                  value={guideContent}
                  onChange={(e) => setGuideContent(e.target.value)}
                  placeholder="Explain step-by-step instructions, safety guidelines, rules, or questions..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  {editingGuide ? 'Save Changes' : 'Publish Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GUIDE PREVIEW */}
      {previewingGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPreviewingGuide(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {previewingGuide.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{previewingGuide.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewingGuide.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingGuide(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {previewingGuide.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewingGuide(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
