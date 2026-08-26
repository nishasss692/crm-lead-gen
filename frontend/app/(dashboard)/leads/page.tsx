"use client";

import React, { useState, useEffect } from 'react';
import DataGrid from '../../components/DataGrid';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    fetch('http://localhost:8000/api/divisions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDivisions(data);
        }
      })
      .catch(err => console.error("Error fetching divisions", err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const divisionQuery = selectedDivision && selectedDivision !== 'All Divisions' 
      ? `&division_name=${encodeURIComponent(selectedDivision)}` 
      : '';
    
    fetch(`http://localhost:8000/api/leads?page=${page}&limit=${limit}${divisionQuery}`)
      .then(res => res.json())
      .then(data => {
        setLeads(data.data || []);
        setTotalLeads(data.total || 0);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching leads", err);
        setIsLoading(false);
      });
  }, [page, selectedDivision]);

  const totalPages = Math.ceil(totalLeads / limit) || 1;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-background">Leads</h1>
          <p className="font-body-base text-body-base text-secondary mt-1">Manage and track your active prospects.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Division Dropdown */}
          <div className="relative">
            <select 
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-300 text-on-surface text-sm rounded-lg h-9 pl-3 pr-8 focus:ring-2 focus:ring-primary/15 focus:border-primary/50 outline-none"
            >
              <option value="">All Divisions</option>
              {divisions.map((div, i) => (
                <option key={i} value={div}>{div}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[20px]">expand_more</span>
          </div>

          <button 
            onClick={() => window.open('http://localhost:8000/api/leads/export-excel', '_blank')}
            className="bg-white border border-slate-300 text-slate-700 h-9 px-4 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p className="font-caption text-caption text-secondary mb-1">Total Active Leads</p>
          <div className="flex items-end justify-between">
            <p className="font-stat-lg text-stat-lg text-on-background">{totalLeads}</p>
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
        <DataGrid 
          leads={leads} 
          loading={isLoading} 
          onLeadUpdated={() => {
            // Trigger a re-fetch or simply keep local state handled by DataGrid
            // The DataGrid component handles local state updates, but we can refresh if needed
          }} 
        />

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary">
                Showing <span className="font-medium">{leads.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium">{Math.min(page * limit, totalLeads)}</span> of <span className="font-medium">{totalLeads}</span> results
              </p>
            </div>
            <div>
              <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
