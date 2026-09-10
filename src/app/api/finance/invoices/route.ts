import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Auto-generate invoice number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    const gstRate = Number(body.gstRate) || 18;
    let subtotal = 0;
    
    const itemsToCreate = body.items.map((item: any) => {
      const rate = Math.round(Number(item.rate));
      const amount = Math.round(Number(item.quantity) * rate);
      subtotal += amount;
      
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || 'nos',
        rate,
        amount,
        hsnCode: item.hsnCode
      };
    });

    const gstAmount = Math.round(subtotal * (gstRate / 100));
    const totalAmount = subtotal + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        projectId: body.projectId || null,
        clientId: body.clientId,
        subtotal,
        gstAmount,
        totalAmount,
        gstRate,
        status: body.status || 'draft',
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        notes: body.notes,
        items: {
          create: itemsToCreate
        }
      },
      include: {
        items: true,
        client: true,
        project: true
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Create invoice error', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
