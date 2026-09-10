import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const phase = await prisma.projectPhase.create({
      data: {
        ...body,
        projectId: id,
      },
    });
    return NextResponse.json(phase);
  } catch (error) {
    console.error('Error adding phase:', error);
    return NextResponse.json({ error: 'Failed to add phase' }, { status: 500 });
  }
}
