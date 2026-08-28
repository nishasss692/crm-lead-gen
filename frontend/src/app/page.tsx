'use client';
import React from 'react';

const PipelineHealth = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between">
    <div className="mb-4 md:mb-0">
      <h2 className="text-2xl font-bold text-slate-800">Lead Management, at a glance.</h2>
      <p className="text-slate-500 mt-1">Your high-level overview of lead conversion performance.</p>
    </div>
    <div className="flex space-x-8">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Contacted rate</p>
        <p className="text-4xl font-bold text-blue-600">68%</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Onboarding rate</p>
        <p className="text-4xl font-bold text-teal-600">24%</p>
      </div>
    </div>
  </div>
);

const KPIGrid = () => {
  const metrics = [
    { label: "Total leads", value: "1,248" },
    { label: "Contact pending", value: "312" },
    { label: "Contacted", value: "848" },
    { label: "Interested", value: "412" },
    { label: "Not interested", value: "436" },
    { label: "Willing to onboard", value: "156" },
    { label: "Onboarded", value: "89" },
    { label: "Onboard pending", value: "67" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{metric.label}</h3>
          <p className="text-2xl font-bold text-slate-800">{metric.value}</p>
        </div>
      ))}
    </div>
  );
};

const ChartsAndLists = () => {
  const priorities = [
    { id: 1, name: "Acme Corp (New York)", leads: 12 },
    { id: 2, name: "TechNova (San Francisco)", leads: 8 },
    { id: 3, name: "Global Industries (London)", leads: 6 },
    { id: 4, name: "Stark Enterprises (Seattle)", leads: 5 },
    { id: 5, name: "Wayne Tech (Gotham)", leads: 3 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - 2/3 width */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Status distribution</h3>
          <select className="bg-slate-50 border border-gray-200 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This Quarter</option>
          </select>
        </div>
        
        {/* Placeholder for Bar Chart */}
        <div className="h-64 flex items-end justify-between space-x-2 border-b border-gray-200 pb-2 relative">
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-400 pointer-events-none">
            <span>400</span>
            <span>300</span>
            <span>200</span>
            <span>100</span>
            <span>0</span>
          </div>
          <div className="w-full flex justify-around items-end h-full pt-6 z-10 pl-8">
            <div className="w-1/6 bg-blue-100 hover:bg-blue-200 rounded-t-sm h-full relative group transition-colors">
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Pending: 312</div>
            </div>
            <div className="w-1/6 bg-blue-300 hover:bg-blue-400 rounded-t-sm h-3/4 relative group transition-colors">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Contacted: 250</div>
            </div>
            <div className="w-1/6 bg-blue-500 hover:bg-blue-600 rounded-t-sm h-1/2 relative group transition-colors">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Interested: 180</div>
            </div>
            <div className="w-1/6 bg-teal-400 hover:bg-teal-500 rounded-t-sm h-1/3 relative group transition-colors">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Willing: 110</div>
            </div>
            <div className="w-1/6 bg-teal-600 hover:bg-teal-700 rounded-t-sm h-1/4 relative group transition-colors">
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Onboarded: 89</div>
            </div>
          </div>
        </div>
        <div className="flex justify-around items-center pt-2 pl-8 text-xs font-medium text-slate-500">
          <span>Pending</span>
          <span>Contacted</span>
          <span>Interested</span>
          <span>Willing</span>
          <span>Onboarded</span>
        </div>
      </div>

      {/* Right Column - 1/3 width */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Priority follow-ups</h3>
        <div className="flex-1">
          <ul className="space-y-4">
            {priorities.map((item) => (
              <li key={item.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mr-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {item.id}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{item.name}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {item.leads} leads
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button className="mt-6 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          View all priorities
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <PipelineHealth />
        <KPIGrid />
        <ChartsAndLists />
      </div>
    </main>
  );
}
