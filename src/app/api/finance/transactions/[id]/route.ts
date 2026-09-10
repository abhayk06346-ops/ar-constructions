import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        vendor: { select: { name: true } },
        client: { select: { name: true } }
      }
    });
    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    const amount = body.amount !== undefined ? Math.round(Number(body.amount)) : undefined;
    const gstAmount = body.gstAmount !== undefined ? Math.round(Number(body.gstAmount)) : undefined;
    
    const dataToUpdate: any = {
      type: body.type,
      category: body.category,
      description: body.description,
      paymentMode: body.paymentMode,
      reference: body.reference,
      date: body.date,
      projectId: body.projectId,
      vendorId: body.vendorId,
      clientId: body.clientId
    };
    
    if (amount !== undefined) dataToUpdate.amount = amount;
    if (gstAmount !== undefined) dataToUpdate.gstAmount = gstAmount;

    // Clean undefined fields
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: dataToUpdate
    });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
