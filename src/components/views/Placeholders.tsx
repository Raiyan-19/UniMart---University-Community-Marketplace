import React from 'react';
import {
  LayoutGrid,
  Layers,
  MessageSquare,
  Heart,
  Users,
  BookOpen,
  HelpCircle,
  GraduationCap,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';

export const BrowseView: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { selectedUniversity } = useUniversity();
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse Listings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover textbooks, electronics, and supplies at {selectedUniversity?.name || 'BAUST'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
            📍 {selectedUniversity?.shortName || 'BAUST'} Campus Feed
          </span>
        </div>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <LayoutGrid className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-slate-900">Marketplace Search & Filters Prepared</h3>
          <p className="text-xs text-slate-500">
            Foundation architecture (User authentication, RBAC, University & Department models) is established and verified. Full product listing CRUD, image galleries, and filter pipelines will be enabled in PART 02.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800"
          >
            Return to Campus Home
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyListingsView: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Listings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your items and services. Edit, delete, or mark as sold.</p>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-slate-900">Seller Dashboard Setup Ready</h3>
          <p className="text-xs text-slate-500">
            Authenticated as <strong className="text-slate-800">{user?.name}</strong> ({user?.role?.toUpperCase()}). In PART 02, you will be able to upload multiple images, manage active and sold statuses, and track views.
          </p>
        </div>
      </div>
    </div>
  );
};

export const MessagesView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
        <p className="text-xs text-slate-500 mt-0.5">Chat with buyers, sellers, and service providers.</p>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-slate-900">Real-Time Messaging System</h3>
          <p className="text-xs text-slate-500">
            Real-time Socket.IO chat rooms between verified buyers and sellers will be activated in PART 03.
          </p>
        </div>
      </div>
    </div>
  );
};

export { GuidesView } from '../guides/GuidesView';
