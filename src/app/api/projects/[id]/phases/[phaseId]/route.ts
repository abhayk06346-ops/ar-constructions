import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string, phaseId: string }> }) {
  try {
    const { phaseId } = await params;
    const body = await request.json();
    
    const phase = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: body,
    });
    return NextResponse.json(phase);
  } catch (error) {
    console.error('Error updating phase:', error);
    return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, phaseId: string }> }) {
  try {
    const { phaseId } = await params;
    await prisma.projectPhase.delete({
      where: { id: phaseId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting phase:', error);
    return NextResponse.json({ error: 'Failed to delete phase' }, { status: 500 });
  }
}
