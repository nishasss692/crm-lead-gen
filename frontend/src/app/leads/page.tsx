'use client';
import React, { useState, useEffect } from 'react';
import LeadsTable, { Lead } from '../components/LeadsTable';

export default function LeadsPage() {
  const [selectedDivision, setSelectedDivision] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const divisions = [
    { id: '', name: 'All Divisions' },
    { id: 'DIV01', name: 'North America' },
    { id: 'DIV02', name: 'Europe' },
    { id: 'DIV03', name: 'Asia Pacific' },
  ];

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        // Attempt to fetch from real backend
        const res = await fetch(`http://localhost:8000/api/leads?division_name=${selectedDivision}&page=${currentPage}&limit=50`);
        if (res.ok) {
           const data = await res.json();
           setLeads(data);
           return;
        }
      } catch (error) {
        console.log("Failed to fetch leads from backend, using mock data.", error);
      } finally {
        setLoading(false);
      }

      // Mock data fallback for demonstration purposes
      const mockData: Lead[] = [
        {
          id: 1, slNo: 1, exporterName: 'Acme Corp', address: '123 Tech Park, NY', pincode: '10001',
          divisionId: 'DIV01', division: 'North America', region: 'East', assignedMeName: 'Jane Doe',
          dateOfMeeting: '2023-10-15', customerMet: 'John Smith', contactNumber: '9876543210',
          email: 'john@acme.com', serviceUsing: 'FedEx', monthlyVolume: 5000, meetingOutcome: 'Positive',
          contractId: 'C-001', remarks: 'Looking for better rates.'
        },
        {
          id: 2, slNo: 2, exporterName: 'Global Traders', address: '45 Trade Ave, London', pincode: 'EC1A 1BB',
          divisionId: 'DIV02', division: 'Europe', region: 'UK', assignedMeName: 'Jane Doe',
          dateOfMeeting: '2023-10-18', customerMet: 'Alice Brown', contactNumber: '1234567890',
          email: 'alice@globaltraders.co.uk', serviceUsing: 'DHL', monthlyVolume: 12000, meetingOutcome: 'Followup',
          contractId: '', remarks: 'Send updated proposal next week.'
        }
      ];
      
      const filtered = selectedDivision ? mockData.filter(d => d.division === selectedDivision) : mockData;
      setLeads(filtered);
    };

    fetchLeads();
  }, [selectedDivision, currentPage]);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="w-full mx-auto">
        
        {/* Top Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800">Operational Data</h2>
            <div className="w-px h-6 bg-gray-300 hidden md:block"></div>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-slate-50 border border-gray-200 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
            >
              {divisions.map((div) => (
                <option key={div.id} value={div.name}>{div.name}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Excel
            </button>
            <button className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Interactive Data Grid */}
        <LeadsTable data={leads} />

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-slate-500">
            Showing page {currentPage} {loading && '(Loading...)'}
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        
      </div>
    </main>
  );
}
