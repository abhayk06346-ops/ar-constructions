import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      todayExpensesData,
      monthExpensesData,
      monthIncomeData,
      allMaterials,
      todayLabourCount,
      totalWorkers,
      recentActivity,
      activeProjectsList
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'in_progress' } }),
      prisma.project.count({ where: { status: 'completed' } }),
      prisma.project.count({ where: { revisedEndDate: { not: null } } }),

      prisma.transaction.aggregate({
        where: { type: 'expense', date: { startsWith: todayStr } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'expense', date: { startsWith: monthStr } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'income', date: { startsWith: monthStr } },
        _sum: { amount: true }
      }),

      prisma.material.findMany(),

      prisma.attendance.count({
        where: { date: todayStr, status: { in: ['present', 'half_day'] } }
      }),
      prisma.worker.count({ where: { status: 'active' } }),

      prisma.transaction.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: { project: true }
      }),

      prisma.project.findMany({
        where: { status: 'in_progress' },
        include: {
          phases: true,
          transactions: {
            where: { type: 'expense' }
          }
        }
      })
    ]);

    const lowStockItems = allMaterials.filter(m => m.currentStock < m.minimumStock);

    const projectSummaries = activeProjectsList.map((p: any) => {
      const spent = p.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const phasesCount = p.phases.length;
      const progress = phasesCount > 0
        ? p.phases.reduce((sum: number, ph: any) => sum + Number(ph.progress), 0) / phasesCount
        : 0;

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        budget: p.estimatedBudget,
        progress,
        spent
      };
    });

    return NextResponse.json({
      activeProjects,
      totalProjects,
      completedProjects,
      delayedProjects,
      todayExpenses: todayExpensesData._sum?.amount || 0,
      monthExpenses: monthExpensesData._sum?.amount || 0,
      monthIncome: monthIncomeData._sum?.amount || 0,
      pendingPayables: 0,
      lowStockItems,
      todayLabourCount,
      totalWorkers,
      recentActivity,
      projectSummaries
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
