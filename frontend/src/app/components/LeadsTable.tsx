'use client';
import React from 'react';

// Define the shape of our Lead data
export interface Lead {
  id: number;
  slNo: number;
  exporterName: string;
  address: string;
  pincode: string;
  divisionId: string;
  division: string;
  region: string;
  assignedMeName: string;
  dateOfMeeting: string;
  customerMet: string;
  contactNumber: string;
  email: string;
  serviceUsing: string;
  monthlyVolume: number;
  meetingOutcome: string;
  contractId: string;
  remarks: string;
}

interface LeadsTableProps {
  data: Lead[];
}

export default function LeadsTable({ data }: LeadsTableProps) {
  const handleBlur = async (id: number, field: string, value: string | number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        console.error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const inputStyles = "w-full bg-transparent border-transparent hover:border-gray-300 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm outline-none transition-colors";
  const selectStyles = "w-full bg-transparent border-transparent hover:border-gray-300 focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 text-sm cursor-pointer outline-none transition-colors";

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold">SL No</th>
              <th className="px-4 py-3 font-semibold">Exporter Name</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 font-semibold">PINCODE</th>
              <th className="px-4 py-3 font-semibold">Division ID</th>
              <th className="px-4 py-3 font-semibold">Division</th>
              <th className="px-4 py-3 font-semibold">Region</th>
              <th className="px-4 py-3 font-semibold">Assigned ME Name</th>
              <th className="px-4 py-3 font-semibold">Date of meeting</th>
              <th className="px-4 py-3 font-semibold">Customer met</th>
              <th className="px-4 py-3 font-semibold">Contact number</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Service using</th>
              <th className="px-4 py-3 font-semibold">Monthly Volume</th>
              <th className="px-4 py-3 font-semibold">Meeting Outcome</th>
              <th className="px-4 py-3 font-semibold">Contract ID</th>
              <th className="px-4 py-3 font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((lead, idx) => (
              <tr key={lead.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 text-slate-600">{lead.slNo}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{lead.exporterName}</td>
                <td className="px-4 py-2 text-slate-600 max-w-[200px] truncate" title={lead.address}>{lead.address}</td>
                <td className="px-4 py-2 text-slate-600">{lead.pincode}</td>
                <td className="px-4 py-2 text-slate-600">{lead.divisionId}</td>
                <td className="px-4 py-2 text-slate-600">{lead.division}</td>
                <td className="px-4 py-2 text-slate-600">{lead.region}</td>
                <td className="px-4 py-2 text-slate-600">{lead.assignedMeName}</td>
                
                {/* Editable Fields */}
                <td className="px-2 py-1">
                  <input
                    type="date"
                    defaultValue={lead.dateOfMeeting}
                    onBlur={(e) => handleBlur(lead.id, 'dateOfMeeting', e.target.value)}
                    className={inputStyles}
                  />
                </td>
                <td className="px-4 py-2 text-slate-600">{lead.customerMet}</td>
                <td className="px-2 py-1">
                  <input
                    type="tel"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    defaultValue={lead.contactNumber}
                    onBlur={(e) => handleBlur(lead.id, 'contactNumber', e.target.value)}
                    className={inputStyles}
                    placeholder="1234567890"
                  />
                </td>
                <td className="px-4 py-2 text-slate-600">{lead.email}</td>
                <td className="px-2 py-1">
                  <select
                    defaultValue={lead.serviceUsing}
                    onBlur={(e) => handleBlur(lead.id, 'serviceUsing', e.target.value)}
                    className={selectStyles}
                  >
                    <option value=""></option>
                    <option value="DHL">DHL</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="Aramex">Aramex</option>
                    <option value="Others">Others</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    defaultValue={lead.monthlyVolume}
                    onBlur={(e) => handleBlur(lead.id, 'monthlyVolume', Number(e.target.value))}
                    className={inputStyles}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    defaultValue={lead.meetingOutcome}
                    onBlur={(e) => handleBlur(lead.id, 'meetingOutcome', e.target.value)}
                    className={selectStyles}
                  >
                    <option value=""></option>
                    <option value="Positive">Positive</option>
                    <option value="Followup">Followup</option>
                    <option value="Not interested">Not interested</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-slate-600">{lead.contractId}</td>
                <td className="px-4 py-2 text-slate-600 max-w-[200px] truncate" title={lead.remarks}>{lead.remarks}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={17} className="px-4 py-8 text-center text-slate-500">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
