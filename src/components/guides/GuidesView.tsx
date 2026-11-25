import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShoppingBag,
  ShieldCheck,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { GuideItem } from '../../types';
import { guidesApi } from '../../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Guides', icon: Sparkles },
  { id: 'freshers', label: "Fresher's Hub", icon: GraduationCap },
  { id: 'trade', label: 'Buying & Selling', icon: ShoppingBag },
  { id: 'safety', label: 'Campus Safety & Zones', icon: ShieldCheck },
  { id: 'faq', label: 'Common FAQs', icon: HelpCircle },
];

export const GuidesView: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const res = await guidesApi.getAll();
        if (res.data) {
          setGuides(res.data);
        }
      } catch (err) {
        console.error('Failed to load guides:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const filteredGuides = guides.filter((g) => {
    const matchesCat = activeCategory === 'all' || g.category === activeCategory;
    const matchesSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.summary.toLowerCase().includes(search.toLowerCase()) ||
      g.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'freshers':
        return { label: "Fresher's Guide", color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'trade':
        return { label: 'Trading Rule', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'safety':
        return { label: 'Campus Safety', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'faq':
        return { label: 'FAQ', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'Guideline', color: 'bg-gray-50 text-gray-800 border-gray-200' };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase">
              Official Resource
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Campus Guides & Safety</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional guidelines, safe meetup protocols, and how-to tips for university members.
          </p>
        </div>

        {/* Quick Safety Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Strictly On-Campus & Verified Exchanges</span>
        </div>
      </div>

      {/* Hero Tip Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-2 sm:space-y-3 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
            Campus Marketplace Standards
          </span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold leading-snug">
            Safe, Transparent & Student-Centric Commerce
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Every transaction is designed to happen within campus boundaries. Inspect goods thoroughly at approved spots like the Central Library or Cafeteria before finalizing payment.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides, safe spots, trading rules, or FAQs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Guides Grid / Accordion */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl h-44 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuides.map((guide) => {
            const badge = getCategoryBadge(guide.category);
            const isExpanded = expandedId === guide.id;
            return (
              <div
                key={guide.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(guide.id)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      title={isExpanded ? 'Collapse' : 'Read details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <h3
                    onClick={() => toggleExpand(guide.id)}
                    className="font-bold text-slate-900 text-sm cursor-pointer hover:text-emerald-700 transition"
                  >
                    {guide.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {guide.summary}
                  </p>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 bg-slate-50/70 p-3.5 rounded-xl leading-relaxed animate-in fade-in duration-200">
                      {guide.content}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => toggleExpand(guide.id)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 transition"
                  >
                    <span>{isExpanded ? 'Show Less' : 'Read Full Guide'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <span>Updated {new Date(guide.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500 shadow-xs">
          No campus guides found matching your query.
        </div>
      )}
    </div>
  );
};
