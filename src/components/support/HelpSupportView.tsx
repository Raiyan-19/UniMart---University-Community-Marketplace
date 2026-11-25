import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  Mail,
  Flag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

interface HelpSupportViewProps {
  onOpenReportModal: () => void;
}

interface FAQItem {
  q: string;
  a: string;
  category: 'getting-started' | 'buying-selling' | 'services' | 'safety-account';
}

const FAQS: FAQItem[] = [
  {
    q: 'How do I create and verify my account on UniMart?',
    a: 'Click on "Sign In / Register" in the top navigation bar. Select your campus (e.g. BAUST, DU, RU, BRUR), enter your official university email domain, and submit the 6-digit verification OTP sent to your inbox. Once confirmed, your account receives the verified campus badge.',
    category: 'getting-started',
  },
  {
    q: 'How do I post a listing to sell an item?',
    a: 'Log into your verified student or faculty account and click "+ Post Listing" in the header. Fill in the product title, category, condition, price in BDT, pickup spot on campus, and upload clear photos. Your listing will go live immediately for your campus community.',
    category: 'buying-selling',
  },
  {
    q: 'How do I contact a seller and negotiate?',
    a: 'Click on any product listing to view full details, then click "Chat with Seller" or "Make Offer". This initiates a private in-app chat thread where you can discuss condition, negotiate price, and set a physical meetup location on campus.',
    category: 'buying-selling',
  },
  {
    q: 'How do payments work on UniMart?',
    a: 'UniMart promotes safe, in-person campus exchanges. We recommend inspecting the item first at a public campus location (such as the campus cafeteria, central library, or departmental corridor) and settling payment directly via bKash, Nagad, or cash.',
    category: 'buying-selling',
  },
  {
    q: 'How can I offer or book a campus service?',
    a: 'Navigate to "Services" from the left menu. You can browse skills posted by fellow students (like thesis typing, coding assistance, tutoring, or PC repairs) or click "+ Offer a Service" to list your own skills and hourly/fixed rates.',
    category: 'services',
  },
  {
    q: 'What is a Graduation Clearance Sale?',
    a: 'Seniors who are graduating can bundle textbooks, calculators, dorm utensils, and project components at a discounted price under the "Graduation Sale" showcase to clear their inventory quickly before completing their term.',
    category: 'services',
  },
  {
    q: 'Is UniMart accessible to non-students or outsiders?',
    a: 'No. UniMart is strictly restricted to verified university members. Every user must have an authentic university email or be approved by the campus administrator, preventing outside commercial spammers and scammers.',
    category: 'safety-account',
  },
  {
    q: 'What should I do if I encounter a suspicious listing or user?',
    a: 'Click the "Report an Issue" button on this support page, or use the flag icon directly on the product/profile. Our campus moderation team investigates reports within a few hours and suspends fraudulent accounts.',
    category: 'safety-account',
  },
  {
    q: 'How do I update my profile or change my password?',
    a: 'Go to "Settings" from the left sidebar. Under "Profile & Academic" you can change your photo, bio, phone number, and semester. Under "Security & Password" you can securely update your password.',
    category: 'safety-account',
  },
  {
    q: 'Where are the best safe spots for item handovers?',
    a: 'Always choose well-lit, populated campus areas during daylight hours: Student Cafeteria, Central Library Lobby, Departmental Common Room, or Campus Security Gate.',
    category: 'safety-account',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'buying-selling', label: 'Buying & Selling' },
  { id: 'services', label: 'Campus Services' },
  { id: 'safety-account', label: 'Safety & Verification' },
];

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onOpenReportModal }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Sleek Minimal Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 sm:p-8 lg:p-10 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
          <span className="inline-block px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
            Help & Knowledge Hub
          </span>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Search guidelines, trade safety rules, account verification tips, or contact our campus helpdesk.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search help topics (e.g. post listing, verification, safety, payment...)"
                className="w-full pl-10 pr-10 py-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Keywords */}
          <div className="flex items-center gap-2 pt-1 text-xs text-emerald-200 flex-wrap">
            <span className="text-emerald-300 text-[11px] font-semibold">Quick Search:</span>
            {['verification', 'payment', 'post listing', 'services', 'safety'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearch(tag)}
                className="px-2.5 py-0.5 rounded-full border border-emerald-700/60 bg-emerald-800/40 text-[11px] hover:bg-emerald-700/80 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.id);
              setOpenFaqIndex(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2-Column Grid: FAQ Content + Unified Support Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: FAQs List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Frequently Asked Questions</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No topics match your search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any articles matching "{search}". Try another keyword or reach out directly to support.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-xs ${
                      isOpen ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 hover:text-emerald-800 cursor-pointer"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-700' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Unified Professional Support Card (Sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1.5">
                Campus Helpdesk
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Need Direct Assistance?</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Our student support and moderation team is available to assist you.
              </p>
            </div>

            {/* Email Support */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                <Mail className="w-4 h-4 text-emerald-700" />
                <span>Official Email Support</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Send queries, feedback, or verification requests:
              </p>
              <a
                href="mailto:support@unimart.edu.bd"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline pt-0.5"
              >
                <span>support@unimart.edu.bd</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Report Problem Action */}
            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report an Issue or Bug</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Found inappropriate content, scam attempts, or technical glitches?
              </p>
              <button
                type="button"
                onClick={onOpenReportModal}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Open Report Form</span>
              </button>
            </div>

            {/* Response Time & Campus Desk Hours */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Desk Hours: Sun – Thu (9 AM – 5 PM)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Typical response within 2 hours on campus days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};