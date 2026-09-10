import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // month, quarter, year

    // For date filtering based on period
    const now = new Date();
    let startDate = new Date();
    if (period === 'month') {
      startDate.setDate(1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setMonth(0);
      startDate.setDate(1);
    }
    
    // Convert to YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: startDateStr }
      },
      include: {
        project: true
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let gstCollected = 0;
    let gstPaid = 0;
    
    const expensesByCategoryMap: Record<string, number> = {};
    const incomeByProjectMap: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        gstCollected += t.gstAmount;
        
        const projectName = t.project?.name || 'Uncategorized';
        incomeByProjectMap[projectName] = (incomeByProjectMap[projectName] || 0) + t.amount;
      } else {
        totalExpenses += t.amount;
        gstPaid += t.gstAmount;
        
        const category = t.category || 'Other';
        expensesByCategoryMap[category] = (expensesByCategoryMap[category] || 0) + t.amount;
      }
    });

    const netProfit = totalIncome - totalExpenses;
    const gstLiability = gstCollected - gstPaid;

    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, total]) => ({
      category,
      total
    }));

    const incomeByProject = Object.entries(incomeByProjectMap).map(([projectName, total]) => ({
      projectName,
      total
    }));

    // Pending Receivables
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['draft', 'sent', 'overdue'] }
      }
    });
    
    const pendingReceivables = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const trendTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: sixMonthsAgoStr }
      }
    });

    const monthlyTrendMap: Record<string, { income: number, expenses: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
      monthlyTrendMap[monthStr] = { income: 0, expenses: 0 };
    }

    trendTransactions.forEach(t => {
      const monthStr = t.date.substring(0, 7);
      if (monthlyTrendMap[monthStr]) {
        if (t.type === 'income') {
          monthlyTrendMap[monthStr].income += t.amount;
        } else {
          monthlyTrendMap[monthStr].expenses += t.amount;
        }
      }
    });

    const monthlyTrend = Object.entries(monthlyTrendMap).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses
    })).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netProfit,
      expensesByCategory,
      incomeByProject,
      monthlyTrend,
      pendingReceivables,
      gstCollected,
      gstPaid,
      gstLiability
    });
  } catch (error) {
    console.error("Finance summary error", error);
    return NextResponse.json({ error: 'Failed to fetch financial summary' }, { status: 500 });
  }
}
