import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  CheckCircle,
  Camera,
  Eye,
  EyeOff,
  GraduationCap,
  Save,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services/api';

export const ProfileSettingsView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { universities, getDepartmentsForUniversity } = useUniversity();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [selectedUnivId, setSelectedUnivId] = useState(user?.universityId || 'univ-baust');
  const [selectedDeptId, setSelectedDeptId] = useState(user?.departmentId || 'dept-baust-cse');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || '3rd Year, 1st Semester');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setSelectedUnivId(user.universityId || 'univ-baust');
      setSelectedDeptId(user.departmentId || 'dept-baust-cse');
      setStudentId(user.studentId || '');
      setDesignation(user.designation || '');
      setCurrentSemester(user.currentSemester || '3rd Year, 1st Semester');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await userApi.updateProfile({
        name,
        phone,
        bio,
        avatar,
        departmentId: selectedDeptId,
        studentId: user?.role === 'student' ? studentId : undefined,
        designation: user?.role === 'teacher' ? designation : undefined,
        currentSemester,
      });

      if (res.success && res.data) {
        updateUser(res.data);
        success('Profile Updated', 'Your profile and academic details have been saved.');
      }
    } catch (err: any) {
      error('Failed to update profile', err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      error('Passwords do not match', 'New password and confirm password must match.');
      return;
    }
    if (newPassword.length < 6) {
      error('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await userApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        success('Password Changed', 'Your account password has been updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      error('Password Update Failed', err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePhotoUploadMock = () => {
    const avatarSeeds = ['Raiyan', 'CampusPro', 'StudentAce', 'TechGuru', 'SmartLearner'];
    const randomSeed = avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)] + Date.now();
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setAvatar(newAvatar);
    success('Avatar Updated', 'New profile picture generated. Click "Save Changes" to apply.');
  };

  const currentDepts = getDepartmentsForUniversity(selectedUnivId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, campus credentials, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-navigation Tabs */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-2 shadow-xs grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                  activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="leading-tight truncate">Profile & Academic</p>
                <p className="text-[10px] text-slate-400 font-normal hidden sm:block mt-0.5">Personal details & university info</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                  activeTab === 'security' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="leading-tight truncate">Security & Password</p>
                <p className="text-[10px] text-slate-400 font-normal hidden sm:block mt-0.5">Password update & access</p>
              </div>
            </button>
          </div>

          {/* Verification Status Card */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <GraduationCap className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Campus Verification</h4>
                <p className="text-[10px] text-emerald-800 font-medium">Verified University Member</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your account is verified under your official campus email. You can trade and access student services across your university.
            </p>
            <div className="pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px]">
                <CheckCircle className="w-3 h-3" /> Active & Verified
              </span>
            </div>
          </div>
        </div>

        {/* Right Main Form Content */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Box 1: Profile Information */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Update your photo and basic public details.</p>
                  </div>

                  {/* Avatar + Change Photo */}
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart'}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-600 shadow-xs"
                    />
                    <div>
                      <button
                        type="button"
                        onClick={handlePhotoUploadMock}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>Change Photo</span>
                      </button>
                      <p className="text-[9px] text-slate-400 mt-1">Random avatar generator</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1712345678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Role</label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold capitalize flex items-center justify-between">
                      <span>{user?.role || 'Student'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Official Institutional Role</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Bio</label>
                    <span className="text-[10px] text-slate-400 tabular-nums">{bio.length}/200</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={200}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your campus peers about yourself..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Box 2: University & Department Information */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Academic Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your department and semester details for campus transactions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">University</label>
                    <select
                      value={selectedUnivId}
                      onChange={(e) => setSelectedUnivId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      {currentDepts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {user?.role === 'student' ? 'Student ID' : 'Designation'}
                    </label>
                    <input
                      type="text"
                      value={user?.role === 'student' ? studentId : designation}
                      onChange={(e) =>
                        user?.role === 'student' ? setStudentId(e.target.value) : setDesignation(e.target.value)
                      }
                      placeholder={user?.role === 'student' ? 'e.g. 200201019' : 'e.g. Assistant Professor'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Current Year / Semester
                    </label>
                    <select
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="1st Year, 1st Semester">1st Year, 1st Semester</option>
                      <option value="1st Year, 2nd Semester">1st Year, 2nd Semester</option>
                      <option value="2nd Year, 1st Semester">2nd Year, 1st Semester</option>
                      <option value="2nd Year, 2nd Semester">2nd Year, 2nd Semester</option>
                      <option value="3rd Year, 1st Semester">3rd Year, 1st Semester</option>
                      <option value="3rd Year, 2nd Semester">3rd Year, 2nd Semester</option>
                      <option value="4th Year, 1st Semester">4th Year, 1st Semester</option>
                      <option value="4th Year, 2nd Semester">4th Year, 2nd Semester</option>
                      <option value="Faculty / Staff">Faculty / Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Box: Change Password */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account password to ensure your campus account remains safe.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Security Recommendation:</p>
                    <p>Use at least 6 characters with a combination of letters and numbers. Never share your password with anyone.</p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Security info box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Account Protection & Session</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your session is authenticated via your institutional domain. If you notice any suspicious activity, change your password immediately or reach out to campus admin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};