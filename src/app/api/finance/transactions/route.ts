import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const projectId = searchParams.get('projectId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const paymentMode = searchParams.get('paymentMode');

  const where: any = {};

  if (type && type !== 'all') {
    where.type = type;
  }
  if (category) {
    where.category = category;
  }
  if (projectId) {
    where.projectId = projectId;
  }
  if (paymentMode) {
    where.paymentMode = paymentMode;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        project: { select: { name: true } },
        vendor: { select: { name: true } },
        client: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Ensure amount and gstAmount are integers (paise)
    const amount = Math.round(Number(body.amount));
    const gstAmount = body.gstAmount ? Math.round(Number(body.gstAmount)) : 0;
    
    const transaction = await prisma.transaction.create({
      data: {
        type: body.type,
        category: body.category,
        amount,
        gstAmount,
        description: body.description,
        paymentMode: body.paymentMode || 'bank_transfer',
        reference: body.reference,
        date: body.date,
        projectId: body.projectId || null,
        vendorId: body.vendorId || null,
        clientId: body.clientId || null
      }
    });
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
