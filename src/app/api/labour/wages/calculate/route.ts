import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workerId = searchParams.get('workerId');
  const periodFrom = searchParams.get('periodFrom');
  const periodTo = searchParams.get('periodTo');

  if (!periodFrom || !periodTo) {
    return NextResponse.json({ error: 'periodFrom and periodTo are required' }, { status: 400 });
  }

  const workerWhere = workerId ? { id: workerId } : {};

  try {
    const workers = await prisma.worker.findMany({
      where: workerWhere,
      include: {
        attendances: {
          where: {
            date: {
              gte: periodFrom,
              lte: periodTo
            }
          }
        },
        wagePayments: {
          where: {
            periodFrom: { gte: periodFrom },
            periodTo: { lte: periodTo }
          }
        }
      }
    });

    const calculatedWages = workers.map(worker => {
      let presentDays = 0;
      let halfDays = 0;
      let overtimeHours = 0;

      worker.attendances.forEach(att => {
        if (att.status === 'present') presentDays += 1;
        else if (att.status === 'half_day') halfDays += 1;
        
        if (att.overtimeHours) {
          overtimeHours += att.overtimeHours;
        }
      });

      const dailyWage = worker.dailyWage || 0;
      // present * wage + half * wage * 0.5 + OT * wage / 8 * 1.5
      const grossWages = 
        (presentDays * dailyWage) + 
        (halfDays * dailyWage * 0.5) + 
        (overtimeHours * (dailyWage / 8) * 1.5);

      const alreadyPaid = worker.wagePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const pending = Math.round(grossWages) - alreadyPaid;

      return {
        worker: {
          id: worker.id,
          name: worker.name,
          skillType: worker.skillType,
          dailyWage: worker.dailyWage
        },
        presentDays,
        halfDays,
        overtimeHours,
        grossWages: Math.round(grossWages),
        alreadyPaid,
        pending
      };
    });

    return NextResponse.json(calculatedWages);
  } catch (error) {
    console.error('Wage calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate wages' }, { status: 500 });
  }
}
