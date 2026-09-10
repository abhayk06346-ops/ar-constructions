import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          where: {
            endDate: null,
          },
          include: {
            project: {
              select: { name: true },
            },
          },
        },
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        type: body.type || 'owned',
        category: body.category,
        vendorId: body.vendorId || null,
        dailyRate: body.dailyRate || 0,
        status: body.status || 'available',
        notes: body.notes || null,
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
