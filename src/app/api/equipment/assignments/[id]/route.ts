import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Calculate totalDays and totalCost if endDate is provided
    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const startDate = new Date(assignment.startDate);
    const endDate = new Date(body.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start day
    const totalCost = totalDays * assignment.equipment.dailyRate;

    const result = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.equipmentAssignment.update({
        where: { id },
        data: {
          endDate: body.endDate,
          totalDays,
          totalCost,
        },
      });

      await tx.equipment.update({
        where: { id: assignment.equipmentId },
        data: { status: 'available' },
      });

      return updatedAssignment;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}
