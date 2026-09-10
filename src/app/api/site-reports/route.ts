import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    where.date = { gte: startDate };
  } else if (endDate) {
    where.date = { lte: endDate };
  }

  try {
    const data = await prisma.dailyReport.findMany({
      where,
      include: { project: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching daily reports", error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Use upsert to update existing report for the day or create a new one
    const item = await prisma.dailyReport.upsert({
      where: {
        projectId_date: {
          projectId: body.projectId,
          date: body.date,
        }
      },
      update: {
        weather: body.weather,
        workDone: body.workDone,
        labourCount: Number(body.labourCount) || 0,
        materialsUsed: body.materialsUsed,
        issues: body.issues,
      },
      create: {
        projectId: body.projectId,
        date: body.date,
        weather: body.weather,
        workDone: body.workDone,
        labourCount: Number(body.labourCount) || 0,
        materialsUsed: body.materialsUsed,
        issues: body.issues,
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating daily report", error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
