import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(changeOrders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const changeOrder = await prisma.changeOrder.create({
      data: {
        ...body,
        projectId: id,
      },
    });

    if (changeOrder.status === 'approved') {
      const project = await prisma.project.findUnique({ where: { id } });
      if (project) {
        const currentBudget = project.revisedBudget || project.estimatedBudget;
        await prisma.project.update({
          where: { id },
          data: {
            revisedBudget: currentBudget + changeOrder.additionalCost
          }
        });
      }
    }

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error('Error creating change order:', error);
    return NextResponse.json({ error: 'Failed to create change order' }, { status: 500 });
  }
}
