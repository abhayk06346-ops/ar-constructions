import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create assignment and update equipment status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.equipmentAssignment.create({
        data: {
          equipmentId: body.equipmentId,
          projectId: body.projectId,
          startDate: body.startDate,
          notes: body.notes || null,
        },
      });

      await tx.equipment.update({
        where: { id: body.equipmentId },
        data: { status: 'in_use' },
      });

      return assignment;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
