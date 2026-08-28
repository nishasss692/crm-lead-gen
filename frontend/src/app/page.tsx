'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Calendar, 
  Download, 
  MoreVertical, 
  Flame, 
  Zap, 
  Snowflake, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  PhoneCall,
  CheckCircle2,
  Filter,
  Eye,
  Briefcase,
  Megaphone,
  Plus,
  Mail,
  Share2,
  Lightbulb,
  AlertTriangle,
  X,
  Target,
  Send,
  Layers,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Trend Chart Data
const ACQUISITION_TRENDS = [
  { name: 'Mon', current: 420, previous: 310 },
  { name: 'Tue', current: 580, previous: 440 },
  { name: 'Wed', current: 710, previous: 520 },
  { name: 'Thu', current: 890, previous: 630 },
  { name: 'Fri', current: 1040, previous: 810 },
  { name: 'Sat', current: 760, previous: 680 },
  { name: 'Sun', current: 950, previous: 720 },
];

// Lead Source Donut Data (India Post logistics channels)
const LEAD_SOURCES = [
  { name: 'Speed Post B2B', value: 45, color: '#D1242F' },
  { name: 'Business Parcel', value: 30, color: '#F7941D' },
  { name: 'Direct Portal', value: 15, color: '#1B2A4A' },
  { name: 'Circle Referrals', value: 10, color: '#2E7D32' },
];

// Recent Activities
const RECENT_ACTIVITIES = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    initials: 'SJ',
    company: 'Acme Export Corp',
    division: 'Bengaluru GPO',
    status: 'Hot',
    statusType: 'hot',
    score: 94,
    source: 'Speed Post B2B',
    lastContact: '2 hours ago',
    email: 'sarah.j@acmexp.com'
  },
  {
    id: 2,
    name: 'Michael Ross',
    initials: 'MR',
    company: 'TechFlow Logistics',
    division: 'Mysuru Central',
    status: 'Warm',
    statusType: 'warm',
    score: 78,
    source: 'Business Parcel',
    lastContact: '5 hours ago',
    email: 'm.ross@techflow.in'
  },
  {
    id: 3,
    name: 'Elena Carter',
    initials: 'EC',
    company: 'Nexus Retail Hub',
    division: 'Belagavi Division',
    status: 'Hot',
    statusType: 'hot',
    score: 91,
    source: 'Direct Portal',
    lastContact: 'Just now',
    email: 'elena@nexusretail.com'
  },
  {
    id: 4,
    name: 'Emily Parker',
    initials: 'EP',
    company: 'Global Dynamics Ltd',
    division: 'Hubballi-Dharwad',
    status: 'Cold',
    statusType: 'cold',
    score: 35,
    source: 'Circle Referrals',
    lastContact: '1 day ago',
    email: 'eparker@globaldyn.org'
  },
  {
    id: 5,
    name: 'Rajesh Sharma',
    initials: 'RS',
    company: 'Karnataka Agro Mills',
    division: 'Mangaluru Circle',
    status: 'Warm',
    statusType: 'warm',
    score: 82,
    source: 'Speed Post B2B',
    lastContact: 'Yesterday',
    email: 'rajesh@agromills.in'
  }
];

// Initial Campaigns Data
interface CampaignItem {
  id: number;
  title: string;
  type: string;
  icon: 'mail' | 'campaign' | 'call' | 'parcel';
  badge: 'Hot' | 'Warm' | 'Cold';
  metric1: { label: string; value: string };
  metric2: { label: string; value: string };
  metric3: { label: string; value: string };
  leadsGen: number;
  status: string;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 1,
    title: 'Q3 Speed Post Corporate Outreach',
    type: 'Email & Letter Sequence',
    icon: 'mail',
    badge: 'Hot',
    metric1: { label: 'Sent', value: '45,200' },
    metric2: { label: 'Open Rate', value: '24.8%' },
    metric3: { label: 'Click Rate', value: '3.2%' },
    leadsGen: 1450,
    status: 'Active'
  },
  {
    id: 2,
    title: 'E-Commerce Logistics Decision Makers',
    type: 'Digital & LinkedIn Targeting',
    icon: 'campaign',
    badge: 'Warm',
    metric1: { label: 'Impressions', value: '128.5K' },
    metric2: { label: 'CTR', value: '1.8%' },
    metric3: { label: 'Spend', value: '₹ 12,400' },
    leadsGen: 890,
    status: 'Active'
  },
  {
    id: 3,
    title: 'Enterprise Outbound Parcel Drive',
    type: 'Field Marketing & Calling',
    icon: 'call',
    badge: 'Cold',
    metric1: { label: 'Calls Made', value: '4,200' },
    metric2: { label: 'Connect Rate', value: '12.5%' },
    metric3: { label: 'Meetings', value: '84' },
    leadsGen: 210,
    status: 'Active'
  },
  {
    id: 4,
    title: 'Postal Life Insurance MSME Drive',
    type: 'Circle Branch Marketing',
    icon: 'parcel',
    badge: 'Hot',
    metric1: { label: 'Brochures', value: '18,500' },
    metric2: { label: 'Inquiries', value: '1,240' },
    metric3: { label: 'Conversion', value: '28.4%' },
    leadsGen: 640,
    status: 'Active'
  }
];

// Channel Performance Over Months
const CHANNEL_DATA = [
  { month: 'Month 1', SpeedPost: 800, BusinessParcel: 550, Calls: 200 },
  { month: 'Month 2', SpeedPost: 950, BusinessParcel: 680, Calls: 280 },
  { month: 'Month 3', SpeedPost: 1200, BusinessParcel: 820, Calls: 350 },
  { month: 'Month 4', SpeedPost: 1450, BusinessParcel: 890, Calls: 410 },
];

function DashboardMainContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'campaigns' ? 'campaigns' : 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns'>(initialTab);
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    type: 'Email & Letter Sequence',
    badge: 'Hot' as 'Hot' | 'Warm' | 'Cold',
    leadsTarget: 500,
    budget: '₹ 25,000'
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'campaigns') {
      setActiveTab('campaigns');
    }
  }, [searchParams]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Company,Division,Status,Lead Score,Source,Last Contact\n"
      + RECENT_ACTIVITIES.map(e => `"${e.name}","${e.company}","${e.division}","${e.status}",${e.score},"${e.source}","${e.lastContact}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leadpulse_overview_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title) return;

    const created: CampaignItem = {
      id: Date.now(),
      title: newCampaign.title,
      type: newCampaign.type,
      icon: newCampaign.type.includes('Email') ? 'mail' : newCampaign.type.includes('Call') ? 'call' : 'campaign',
      badge: newCampaign.badge,
      metric1: { label: 'Reach', value: '12,000' },
      metric2: { label: 'Target Leads', value: `${newCampaign.leadsTarget}` },
      metric3: { label: 'Budget', value: newCampaign.budget },
      leadsGen: 0,
      status: 'Active'
    };

    setCampaigns([created, ...campaigns]);
    setIsNewCampaignModalOpen(false);
    setNewCampaign({
      title: '',
      type: 'Email & Letter Sequence',
      badge: 'Hot',
      leadsTarget: 500,
      budget: '₹ 25,000'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D1242F]"></span>
            <span className="text-xs font-bold text-[#D1242F] uppercase tracking-wider">India Post CRM Executive View</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'overview' ? 'Overview Dashboard' : 'Active Campaigns & Outreach'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {activeTab === 'overview' 
              ? 'Real-time performance metrics, logistics pipeline, and lead acquisition activity.'
              : 'Monitor commercial parcel, logistics outreach, and marketing campaigns across circles.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#D1242F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-white text-[#D1242F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Campaigns</span>
              <span className="bg-[#D1242F] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {campaigns.length}
              </span>
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20 cursor-pointer"
                >
                  <option>Last 30 Days</option>
                  <option>This Quarter</option>
                  <option>Year to Date</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 bg-[#D1242F] hover:bg-[#B01E28] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsNewCampaignModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#D1242F] hover:bg-[#B01E28] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW ANALYTICS
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Leads */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Leads</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D1242F] flex items-center justify-center group-hover:bg-[#D1242F] group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">12,450</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +14.5%
                  </span>
                  <span className="text-slate-400 text-[11px]">vs last month</span>
                </div>
              </div>
            </div>

            {/* KPI 2: New Leads Today */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Leads Today</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#F7941D] flex items-center justify-center group-hover:bg-[#F7941D] group-hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">342</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +5.2%
                  </span>
                  <span className="text-slate-400 text-[11px]">vs yesterday</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Conversion Rate */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center group-hover:bg-[#1565C0] group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">8.4%</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="flex items-center font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -1.2%
                  </span>
                  <span className="text-slate-400 text-[11px]">vs last month</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Pipeline Value */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Postal Pipeline Value</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2E7D32] flex items-center justify-center group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">₹ 2.4 Cr</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +22.8%
                  </span>
                  <span className="text-slate-400 text-[11px]">vs last quarter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Line/Area Trends + Lead Source Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Lead Acquisition Trends Area Chart */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Lead Acquisition Trends</h2>
                  <p className="text-xs text-slate-500">Comparing current week acquisition volume with previous cycle</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#D1242F]"></span>
                    <span className="text-slate-700">Current Week</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 border-b-2 border-dashed border-slate-400"></span>
                    <span className="text-slate-500">Previous</span>
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ACQUISITION_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ipRedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D1242F" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D1242F" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#FAB52C' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#D1242F" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#ipRedGradient)" 
                      name="Current Week"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#94A3B8" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4"
                      fill="transparent" 
                      name="Previous Week"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1 Col: Lead Source Donut Chart */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-extrabold text-slate-900">Lead Sources</h2>
                <span className="text-xs bg-amber-50 text-[#F7941D] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Active Channel Mix
                </span>
              </div>

              <div className="relative h-[200px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={LEAD_SOURCES}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {LEAD_SOURCES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-900 leading-tight">100%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Mix</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {LEAD_SOURCES.map((src) => (
                  <div key={src.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: src.color }}></span>
                      <span className="text-slate-600 font-medium">{src.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{src.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Recent Lead Engagements</h2>
                <p className="text-xs text-slate-500">Latest business inquiries requiring follow-up from postal agents</p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-bold text-[#D1242F] hover:text-[#B01E28] flex items-center gap-1 hover:underline"
              >
                <span>View All Leads</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Lead Name</th>
                    <th className="py-3 px-4">Company & Division</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Lead Score</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Last Contact</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {RECENT_ACTIVITIES.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {lead.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{lead.name}</p>
                            <p className="text-[11px] text-slate-400">{lead.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{lead.company}</div>
                        <div className="text-[11px] text-slate-500">
                          {lead.division}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {lead.statusType === 'hot' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-[#D1242F] border border-red-200">
                            <Flame className="w-3 h-3 text-[#D1242F]" /> Qualified (Hot)
                          </span>
                        )}
                        {lead.statusType === 'warm' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Zap className="w-3 h-3 text-amber-600" /> Contacted
                          </span>
                        )}
                        {lead.statusType === 'cold' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Snowflake className="w-3 h-3 text-slate-400" /> Cold Lead
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          lead.score >= 85 ? 'bg-red-50 text-[#D1242F]' : lead.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lead.score} / 100
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-600">
                        {lead.source}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {lead.lastContact}
                      </td>

                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === lead.id ? null : lead.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === lead.id && (
                          <div className="absolute right-4 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-left text-xs animate-fade-in-scale">
                            <Link href="/leads" className="block px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium">
                              View Details
                            </Link>
                            <Link href="/leads" className="block px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium">
                              Schedule Call
                            </Link>
                            <button 
                              onClick={() => setActiveMenuId(null)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[#D1242F] font-semibold border-t border-slate-100"
                            >
                              Mark Converted
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: ACTIVE CAMPAIGNS & OUTREACH
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Top Bento KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Total Leads Generated
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">12,450</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.2% from last month</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Avg Conversion Rate
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">4.8%</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+0.5% from last month</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Total Campaign Spend
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">₹ 45.2K</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#D1242F] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+8.1% from last month</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Cost Per Lead (CPL)
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">₹ 3.63</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-1.2% from last month</span>
              </div>
            </div>
          </div>

          {/* Main Grid: Left 8 Cols (Campaign Cards), Right 4 Cols (Leads by Channel + AI Insights) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Active Campaign Cards */}
            <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1242F]/5 rounded-bl-full pointer-events-none"></div>

                  {/* Campaign Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
                        {camp.icon === 'mail' ? (
                          <Mail className="w-5 h-5" />
                        ) : camp.icon === 'call' ? (
                          <PhoneCall className="w-5 h-5" />
                        ) : (
                          <Megaphone className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {camp.title}
                        </h3>
                        <p className="text-[11px] text-slate-500">{camp.type}</p>
                      </div>
                    </div>

                    {/* Hot / Warm / Cold Badge */}
                    {camp.badge === 'Hot' && (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#D1242F] border border-red-200 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#D1242F]" /> Hot Campaign
                      </span>
                    )}
                    {camp.badge === 'Warm' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" /> Warm
                      </span>
                    )}
                    {camp.badge === 'Cold' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Snowflake className="w-3 h-3 text-slate-400" /> Cold
                      </span>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 mb-3 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">{camp.metric1.label}</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{camp.metric1.value}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">{camp.metric2.label}</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{camp.metric2.value}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5">{camp.metric3.label}</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{camp.metric3.value}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold text-slate-700">{camp.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 mr-2">Leads Generated</span>
                      <span className="font-extrabold text-[#D1242F] text-base">{camp.leadsGen.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Chart + AI Insights */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
              {/* Leads by Channel Bar Chart */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-900">Leads by Channel</h3>
                <p className="text-xs text-slate-500 mb-4">Comparing top postal marketing channels over 4 months</p>

                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHANNEL_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Bar dataKey="SpeedPost" fill="#D1242F" name="Speed Post" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="BusinessParcel" fill="#F7941D" name="Business Parcel" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Calls" fill="#1B2A4A" name="Direct Calls" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D1242F]"></span>
                    <span className="text-slate-700">Speed Post</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#F7941D]"></span>
                    <span className="text-slate-700">Parcel</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1B2A4A]"></span>
                    <span className="text-slate-700">Calls</span>
                  </div>
                </div>
              </div>

              {/* Postal AI Insights */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded-md bg-amber-50 text-[#F7941D]">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Postal AI Insights</h3>
                </div>

                <ul className="space-y-3 text-xs">
                  <li className="flex gap-2.5 items-start p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
                    <Sparkles className="w-4 h-4 text-[#D1242F] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Increase E-Commerce Outreach</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        CPL is 15% lower than circle average for Bengaluru and Mysuru MSME sellers.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-2.5 items-start p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Email Fatigue Detected</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Open rates on sequence 3 dropped by 4% this week. Consider switching to postal desk dispatch.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Create New Postal Campaign</h3>
                  <p className="text-xs text-slate-500">Launch marketing drive across Karnataka Circle</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Festive MSME Shipping Drive"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20 focus:border-[#D1242F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Channel Type</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20 bg-white"
                  >
                    <option>Email & Letter Sequence</option>
                    <option>Digital & LinkedIn Ads</option>
                    <option>Field Marketing & Calling</option>
                    <option>Circle Branch Direct Drive</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Badge</label>
                  <select
                    value={newCampaign.badge}
                    onChange={(e) => setNewCampaign({ ...newCampaign, badge: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20 bg-white"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Leads</label>
                  <input
                    type="number"
                    value={newCampaign.leadsTarget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, leadsTarget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget Allocation</label>
                  <input
                    type="text"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1242F]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D1242F] hover:bg-[#B01E28] text-white rounded-lg font-bold shadow-xs hover:shadow"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-bold">Loading Dashboard...</div>}>
      <DashboardMainContent />
    </Suspense>
  );
}
