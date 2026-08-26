'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DataGrid, { Lead } from '../components/DataGrid';
import { Menu } from 'lucide-react';

const DIVISIONS = [
  "Bagalkot", "Ballari", "Belagavi", "BG East", "BG GPO", "BG South", "BG West", 
  "Bidar", "Channapatna", "Chikkamagaluru", "Chikodi", "Chitradurga", "Davanagere", 
  "Dharwad", "Gadag", "Gokak", "Hassan", "Haveri", "Kalaburagi", "Karwar", "Kodagu", 
  "Kolar", "Mandya", "Mangaluru", "Mysuru", "Nanjangud", "Puttur", "Raichur", 
  "Shimoga", "Sirsi", "Tumkur", "Udupi", "Vijayapura", "Yadgir"
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'settings'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const itemsPerPage = 50;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `http://localhost:8000/api/leads?page=${currentPage}&limit=${itemsPerPage}`;
      if (selectedDivision) {
        url += `&division_name=${encodeURIComponent(selectedDivision)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      
      setLeads(data.data || []);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Unable to load data. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision, currentPage]);

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDivision(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/leads/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await fetchLeads();
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = 'http://localhost:8000/api/leads/export-excel';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-8 relative">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex justify-start relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Features Menu"
              >
                <Menu size={24} />
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-12 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2">
                  <button 
                    onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Database
                  </button>
                  <button 
                    onClick={() => { setActiveTab('leads'); setMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${activeTab === 'leads' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Lead Details
                  </button>
                  <button 
                    onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'dashboard' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Database Dashboard</h1>
                  <p className="text-slate-500 mt-1">Upload new lead lists or export existing data to CSV.</p>
                </div>
                <div className="flex gap-4">
                  <input 
                    type="file" 
                    accept=".xlsx, .csv" 
                    ref={fileInputRef}
                    onChange={handleUpload}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Upload Leads
                  </button>
                  <button 
                    onClick={handleExport}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Lead Details</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage and track your lead statuses.</p>
                  </div>
                  <div className="w-64">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Division</label>
                    <select 
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
                      value={selectedDivision}
                      onChange={handleDivisionChange}
                    >
                      <option value="">All Divisions</option>
                      {DIVISIONS.map((div, i) => (
                        <option key={i} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm">
                      <p className="font-medium">Error loading leads</p>
                      <p className="text-sm mt-1">{error}</p>
                      <button 
                        onClick={fetchLeads}
                        className="mt-3 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <DataGrid 
                        leads={leads} 
                        loading={loading} 
                        onLeadUpdated={fetchLeads} 
                      />
                      
                      {!loading && totalRecords > 0 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-slate-600 font-medium">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-slate-500">
                <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h3 className="text-lg font-medium text-slate-700">Settings</h3>
                <p className="mt-1">Settings and configuration options will be available here soon.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
