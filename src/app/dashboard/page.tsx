"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, StatCard, Badge, DataTable, EmptyState, Button } from '@/components/ui';
import { formatCurrency, formatDate, formatIndianNumber } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-gray-200 rounded-lg"></div>
          <div className="lg:col-span-1 h-64 bg-gray-200 rounded-lg"></div>
          <div className="lg:col-span-1 h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const transactionColumns = [
    { 
      key: 'date', 
      label: 'Date', 
      render: (t: any) => formatDate(t.date) 
    },
    { 
      key: 'description', 
      label: 'Description' 
    },
    { 
      key: 'project', 
      label: 'Project', 
      render: (t: any) => t.project?.name || '-' 
    },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (t: any) => (
        <span className={t.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      )
    },
    { 
      key: 'paymentMode', 
      label: 'Mode',
      render: (t: any) => <span className="capitalize">{t.paymentMode?.replace('_', ' ')}</span>
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back to AR Constructions overview.</p>
        </div>
      </div>

      {/* Top row - 4 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Projects" 
          value={formatIndianNumber(data.activeProjects)} 
          icon="🏗️" 
          subtitle={`${data.completedProjects} completed`} 
          trend="neutral" 
        />
        <StatCard 
          title="This Month's Income" 
          value={formatCurrency(data.monthIncome)} 
          icon="💰" 
          trend="up" 
        />
        <StatCard 
          title="This Month's Expenses" 
          value={formatCurrency(data.monthExpenses)} 
          icon="📉" 
          trend="down" 
        />
        <StatCard 
          title="Workers on Site Today" 
          value={formatIndianNumber(data.todayLabourCount)} 
          icon="👷" 
          subtitle={`Out of ${data.totalWorkers} total`} 
          trend="neutral" 
        />
      </div>

      {/* Second row - 3 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        <Card title="Active Projects Overview">
          {data.projectSummaries?.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data.projectSummaries.map((p: any) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-blue-900 hover:underline">
                      {p.name}
                    </Link>
                    <Badge variant={p.status === 'in_progress' ? 'info' : 'neutral'}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(p.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, p.progress)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Spent: {formatCurrency(p.spent)}</span>
                    <span className="text-gray-900 font-medium">Budget: {formatCurrency(p.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active projects" description="Start a new project to see it here." icon="🏗️" />
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card title="Low Stock Alerts">
          {data.lowStockItems?.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {data.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-orange-50 text-orange-900 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs opacity-80">Min: {item.minimumStock} {item.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.currentStock} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-4xl mb-2">✅</span>
              <h3 className="text-lg font-medium text-green-800">All stocks healthy</h3>
              <p className="text-sm text-green-600 mt-1">No materials are below minimum stock.</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3 h-full">
            <Link href="/finance" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</span>
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
            </Link>
            <Link href="/site-reports" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📸</span>
              <span className="text-sm font-medium text-gray-700">Site Report</span>
            </Link>
            <Link href="/labour" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">✅</span>
              <span className="text-sm font-medium text-gray-700">Attendance</span>
            </Link>
            <Link href="/inventory" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</span>
              <span className="text-sm font-medium text-gray-700">Stock Entry</span>
            </Link>
            <Link href="/projects" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📁</span>
              <span className="text-sm font-medium text-gray-700">New Project</span>
            </Link>
            <Link href="/finance" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group">
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">💰</span>
              <span className="text-sm font-medium text-gray-700">Record Payment</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Third row */}
      <Card title="Recent Activity" action={<Link href="/finance"><Button variant="secondary" size="sm">View All</Button></Link>}>
        {data.recentActivity?.length > 0 ? (
          <DataTable 
            columns={transactionColumns} 
            data={data.recentActivity} 
            emptyMessage="No recent activity found."
          />
        ) : (
          <EmptyState title="No transactions yet" description="Record your first income or expense." icon="💳" />
        )}
      </Card>
    </div>
  );
}
