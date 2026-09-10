import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true
      }
    });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    // We mainly update status, dates, notes
    const dataToUpdate: any = {};
    if (body.status) dataToUpdate.status = body.status;
    if (body.issueDate) dataToUpdate.issueDate = body.issueDate;
    if (body.dueDate) dataToUpdate.dueDate = body.dueDate;
    if (body.paidDate !== undefined) dataToUpdate.paidDate = body.paidDate;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: true
      }
    });
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
