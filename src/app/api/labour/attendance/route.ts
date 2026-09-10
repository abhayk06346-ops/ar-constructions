import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const date = searchParams.get('date');
  const workerId = searchParams.get('workerId');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (date) where.date = date;
  if (workerId) where.workerId = workerId;

  try {
    const data = await prisma.attendance.findMany({
      where,
      include: {
        worker: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, projectId, date, status, overtimeHours, notes } = body;

    const item = await prisma.attendance.upsert({
      where: {
        workerId_date: {
          workerId,
          date
        }
      },
      update: {
        status,
        overtimeHours: overtimeHours || 0,
        projectId,
        notes
      },
      create: {
        workerId,
        projectId,
        date,
        status,
        overtimeHours: overtimeHours || 0,
        notes
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
