import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const skillType = searchParams.get('skillType');
  const status = searchParams.get('status');
  const contractorId = searchParams.get('contractorId');

  const where: any = {};
  if (skillType) where.skillType = skillType;
  if (status) where.status = status;
  if (contractorId) where.contractorId = contractorId;

  try {
    const data = await prisma.worker.findMany({
      where,
      include: {
        contractor: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.worker.create({ data: body });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
