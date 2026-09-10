import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, date, records } = body;

    if (!projectId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const results = await prisma.$transaction(
      records.map((record: any) => 
        prisma.attendance.upsert({
          where: {
            workerId_date: {
              workerId: record.workerId,
              date: date
            }
          },
          update: {
            status: record.status,
            overtimeHours: record.overtimeHours || 0,
            projectId: projectId,
            notes: record.notes
          },
          create: {
            workerId: record.workerId,
            projectId: projectId,
            date: date,
            status: record.status,
            overtimeHours: record.overtimeHours || 0,
            notes: record.notes
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record bulk attendance' }, { status: 500 });
  }
}
