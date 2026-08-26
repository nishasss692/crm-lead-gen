"use client";

import React, { useState, useRef } from 'react';

export default function DashboardPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/leads/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await response.json();
      setUploadMessage({ type: 'success', text: `Successfully imported ${data.successful_inserts} leads!` });
    } catch (error: any) {
      setUploadMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    window.open('http://localhost:8000/api/leads/export-excel', '_blank');
  };

  const handleDeduplicate = async () => {
    setIsDeduplicating(true);
    setUploadMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/leads/deduplicate', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to deduplicate leads');
      }
      const data = await response.json();
      setUploadMessage({ type: 'success', text: `Deduplication complete. Removed ${data.deleted_count} duplicate leads.` });
    } catch (error: any) {
      setUploadMessage({ type: 'error', text: `Deduplication failed: ${error.message}` });
    } finally {
      setIsDeduplicating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg text-on-background mb-1">Data Management</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">Import new leads from Excel/CSV or export your existing data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">upload_file</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-on-background">Import Leads</h2>
            <p className="font-body-base text-body-base text-on-surface-variant mt-1">Upload your CSV or Excel file to batch import leads into the CRM.</p>
          </div>
          
          <div className="mt-auto">
            {uploadMessage && (
              <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-error-container text-on-error-container border border-error/20'}`}>
                {uploadMessage.text}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload}
            />

            <div 
              onClick={triggerFileInput}
              className="border-2 border-dashed border-outline-variant rounded-lg p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer mb-4"
            >
              <span className="material-symbols-outlined text-outline text-3xl mb-2">cloud_upload</span>
              <p className="font-body-medium text-body-medium text-on-surface">Click to upload or drag and drop</p>
              <p className="font-caption text-caption text-outline mt-1">.xlsx, .xls, .csv up to 10MB</p>
            </div>
            <button 
              onClick={triggerFileInput}
              disabled={isUploading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  <span>Upload Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">download</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-on-background">Export Data</h2>
            <p className="font-body-base text-body-base text-on-surface-variant mt-1">Download your complete leads database as an Excel spreadsheet.</p>
          </div>
          
          <div className="mt-auto">
            <div className="bg-surface-container rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body-medium text-body-medium text-on-surface">Format Supported</span>
                <span className="font-bold text-on-background">.xlsx</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-medium text-body-medium text-on-surface">Source</span>
                <span className="font-caption text-caption text-outline">All Leads Table</span>
              </div>
            </div>
            <button 
              onClick={handleExport}
              className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export as Excel</span>
            </button>
          </div>
        </div>

        {/* Deduplicate Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <div className="w-12 h-12 bg-error-container text-on-error-container rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">cleaning_services</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-on-background">Deduplicate Leads</h2>
            <p className="font-body-base text-body-base text-on-surface-variant mt-1">Find and remove duplicate leads based on email address. Keeps the most recent entry.</p>
          </div>
          
          <div className="mt-auto">
            <div className="bg-surface-container rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body-medium text-body-medium text-on-surface">Criteria</span>
                <span className="font-bold text-on-background">Exact Email</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-medium text-body-medium text-on-surface">Retention</span>
                <span className="font-caption text-caption text-outline">Newest First</span>
              </div>
            </div>
            <button 
              onClick={handleDeduplicate}
              disabled={isDeduplicating}
              className="w-full bg-error text-on-error py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-error/90 transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeduplicating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Cleaning...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <span>Run Deduplication</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
