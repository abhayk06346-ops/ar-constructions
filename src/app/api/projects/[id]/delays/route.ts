import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const delayLogs = await prisma.delayLog.findMany({
      where: { projectId: id },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(delayLogs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    let daysLost = body.daysLost;
    
    // Auto-calculate daysLost if not explicitly provided
    if (!daysLost && body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysLost = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const delayLog = await prisma.delayLog.create({
      data: {
        ...body,
        daysLost: daysLost || 1,
        projectId: id,
      },
    });

    const project = await prisma.project.findUnique({ where: { id } });
    if (project) {
      const currentEndDate = new Date(project.revisedEndDate || project.expectedEndDate);
      currentEndDate.setDate(currentEndDate.getDate() + delayLog.daysLost);
      
      await prisma.project.update({
        where: { id },
        data: {
          revisedEndDate: currentEndDate.toISOString().split('T')[0]
        }
      });
    }

    return NextResponse.json(delayLog);
  } catch (error) {
    console.error('Error creating delay log:', error);
    return NextResponse.json({ error: 'Failed to create delay log' }, { status: 500 });
  }
}
