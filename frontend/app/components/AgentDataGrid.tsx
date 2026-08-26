'use client';
import React, { useState } from 'react';
import { Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export interface Lead {
  id: string | number;
  company_name: string;
  division: string;
  assigned_agent: string;
  status: string;
  query_notes: string;
}

interface AgentDataGridProps {
  leads: Lead[];
  loading: boolean;
  onLeadUpdated: () => void; // callback to refresh or update state
}

const ITEMS_PER_PAGE = 10;

export default function AgentDataGrid({ leads, loading, onLeadUpdated }: AgentDataGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  // Local state for edits
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pagination logic
  const totalPages = Math.ceil(leads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLeads = leads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleEditClick = (lead: Lead) => {
    setEditingId(lead.id);
    setEditStatus(lead.status || '');
    setEditNotes(lead.query_notes || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string | number) => {
    try {
      setIsSaving(true);
      const payload = {
        status: editStatus,
        query_notes: editNotes
      };
      
      const response = await fetch(`http://localhost:8000/api/leads/${id}/update-query`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      toast.success('Lead updated successfully');
      setEditingId(null);
      onLeadUpdated(); // refresh list
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">Assigned Leads</h2>
        <div className="text-sm text-slate-500 font-medium">
          Total: {leads.length} Records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold">Name / Company</th>
              <th className="px-6 py-4 font-semibold">Division</th>
              <th className="px-6 py-4 font-semibold">Assigned Agent</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold w-1/3">Query Notes</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No leads found. Please upload data or check back later.
                </td>
              </tr>
            ) : (
              currentLeads.map((lead) => {
                const isEditing = editingId === lead.id;
                
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{lead.company_name}</div>
                      <div className="text-xs text-slate-500 mt-1">ID: {lead.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {lead.division}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {lead.assigned_agent}
                    </td>
                    
                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select 
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full border border-slate-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Lost">Lost</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                          ${lead.status?.toLowerCase() === 'new' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            lead.status?.toLowerCase() === 'qualified' ? 'bg-green-50 text-green-700 border-green-100' : 
                            lead.status?.toLowerCase() === 'lost' ? 'bg-red-50 text-red-700 border-red-100' : 
                            'bg-orange-50 text-orange-700 border-orange-100'}
                        `}>
                          {lead.status || 'New'}
                        </span>
                      )}
                    </td>

                    {/* Query Notes Column */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full border border-slate-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add notes..."
                        />
                      ) : (
                        <div className="truncate max-w-xs" title={lead.query_notes}>
                          {lead.query_notes || '-'}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleSaveEdit(lead.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEditClick(lead)}
                          className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, leads.length)}</span> of <span className="font-medium text-slate-900">{leads.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
