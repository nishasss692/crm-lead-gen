"use client";

import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface AnalyticsData {
  total_leads: number;
  new_leads: number;
  conversion_rate: string;
  active_campaigns: number;
  chart_data?: {
    labels: string[];
    data: number[];
  };
  leaderboard?: {
    name: string;
    role: string;
    avatar: string;
    leads_handled: number;
    win_rate: string;
    revenue: string;
  }[];
}

export default function AnalyticsPage() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<AnalyticsData>({
    total_leads: 0,
    new_leads: 0,
    conversion_rate: '0%',
    active_campaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/analytics')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((resData) => {
        setData(resData || {
          total_leads: 0,
          new_leads: 0,
          conversion_rate: '0%',
          active_campaigns: 0,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let chartInstance: Chart | null = null;
    if (chartRef.current && data.chart_data) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const primaryColor = '#004ac6';
        const primaryLight = 'rgba(0, 74, 198, 0.1)';
        const gridColor = '#e2e8f0';
        const textColor = '#434655';

        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.chart_data.labels,
            datasets: [{
              label: 'Qualified Leads',
              data: data.chart_data.data,
              borderColor: primaryColor,
              backgroundColor: primaryLight,
              borderWidth: 2,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: primaryColor,
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#0b1c30',
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                padding: 10,
                displayColors: false,
                callbacks: {
                  label: function(context: any) {
                    return context.parsed.y + ' Leads';
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  drawBorder: false
                } as any,
                ticks: {
                  font: { family: 'Inter', size: 12 },
                  color: textColor
                }
              },
              y: {
                grid: {
                  color: gridColor,
                  borderDash: [5, 5],
                  drawBorder: false
                } as any,
                ticks: {
                  font: { family: 'Inter', size: 12 },
                  color: textColor,
                  maxTicksLimit: 6
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          }
        });
      }
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [data]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-background">Analytics Overview</h2>
          <p className="font-body-base text-body-base text-on-surface-variant mt-1">Key performance metrics and team insights for Q3.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface font-body-medium text-body-medium rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors h-9 flex items-center shadow-sm">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
          <button className="bg-surface-container-lowest border border-outline-variant text-on-surface font-body-medium text-body-medium rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-surface-container-low transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/15 h-9">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KPI Row (Full Width) */}
        <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* KPI 1 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 ambient-shadow flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-body-medium text-body-medium text-on-surface-variant">Total Leads</span>
              <div className="bg-primary-container/10 p-1.5 rounded-md">
                <span className="material-symbols-outlined text-primary text-[20px]">group_add</span>
              </div>
            </div>
            <div>
              <div className="font-stat-lg text-stat-lg text-on-background">
                {loading ? '...' : (data?.total_leads || 0).toLocaleString()}
              </div>
              <div className="flex items-center mt-1 space-x-1">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[16px]">trending_up</span>
                <span className="font-caption text-caption text-tertiary font-medium">+14.2%</span>
                <span className="font-caption text-caption text-outline">vs last month</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-10 bg-gradient-to-tl from-primary to-transparent rounded-tl-full pointer-events-none group-hover:opacity-20 transition-opacity"></div>
          </div>

          {/* KPI 3 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 ambient-shadow flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-body-medium text-body-medium text-on-surface-variant">Avg Deal Size</span>
              <div className="bg-secondary-container p-1.5 rounded-md">
                <span className="material-symbols-outlined text-on-secondary-container text-[20px]">payments</span>
              </div>
            </div>
            <div>
              <div className="font-stat-lg text-stat-lg text-on-background">$42.5k</div>
              <div className="flex items-center mt-1 space-x-1">
                <span className="material-symbols-outlined text-error text-[16px]">trending_down</span>
                <span className="font-caption text-caption text-error font-medium">-1.4%</span>
                <span className="font-caption text-caption text-outline">vs last month</span>
              </div>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 ambient-shadow flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
              <span className="font-body-medium text-body-medium text-on-surface-variant">Sales Cycle</span>
              <div className="bg-surface-container-highest p-1.5 rounded-md">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">schedule</span>
              </div>
            </div>
            <div>
              <div className="font-stat-lg text-stat-lg text-on-background">34 days</div>
              <div className="flex items-center mt-1 space-x-1">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[16px]">trending_down</span>
                <span className="font-caption text-caption text-tertiary font-medium">-4 days</span>
                <span className="font-caption text-caption text-outline">faster than avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Volume (Line Chart) */}
        <div className="col-span-1 lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg ambient-shadow flex flex-col">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-title-lg text-title-lg text-on-background">Monthly Lead Volume</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-container-high focus:outline-none">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
          <div className="p-5 flex-1 min-h-[300px] relative w-full">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>



        {/* Leaderboard */}
        <div className="col-span-1 lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg ambient-shadow overflow-hidden">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright/50">
            <div>
              <h3 className="font-title-lg text-title-lg text-on-background">Team Performance Leaderboard</h3>
              <p className="font-caption text-caption text-on-surface-variant mt-0.5">Ranked by Closed Won revenue</p>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-[18px]">search</span>
                </div>
                <input className="block w-48 pl-9 pr-3 py-1.5 h-8 border border-outline-variant rounded-md leading-5 bg-surface-container-lowest placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-caption font-caption transition-colors" placeholder="Find rep..." type="text"/>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider w-16">Rank</th>
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider">Representative</th>
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider text-right">Leads Handled</th>
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider text-right">Win Rate</th>
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider text-right">Revenue Generated</th>
                  <th className="py-3 px-5 font-label-caps text-label-caps text-on-surface-variant font-semibold tracking-wider text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body-base text-body-base">
                {data.leaderboard && data.leaderboard.map((agent, idx) => (
                  <tr key={idx} className={`hover:bg-surface-container-lowest/50 transition-colors h-[48px] ${idx === 0 ? 'bg-primary-container/5' : ''}`}>
                    <td className="py-2 px-5 text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mx-auto ${idx === 0 ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface border border-outline-variant'}`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-2 px-5">
                      <div className="flex items-center space-x-3">
                        <img alt={agent.name} className="w-8 h-8 rounded-full object-cover border border-outline-variant" src={agent.avatar}/>
                        <div>
                          <div className="font-medium text-on-background">{agent.name}</div>
                          <div className="font-caption text-caption text-on-surface-variant">{agent.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-5 text-right font-medium text-on-surface">{agent.leads_handled}</td>
                    <td className="py-2 px-5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${idx === 0 ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary-fixed-dim/30' : 'bg-surface-container text-on-surface border border-outline-variant/30'}`}>
                        {agent.win_rate}
                      </span>
                    </td>
                    <td className="py-2 px-5 text-right font-semibold text-on-background">{agent.revenue}</td>
                    <td className="py-2 px-5 text-center">
                      <span className="material-symbols-outlined text-tertiary">trending_up</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex justify-center">
            <button className="text-primary font-body-medium text-body-medium hover:underline text-sm focus:outline-none">View Full Leaderboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
