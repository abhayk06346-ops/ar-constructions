import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
        invoices: {
          select: {
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    // Calculate sum of invoice totals and sum of paid invoices
    const clientsWithSums = clients.map((client) => {
      const totalBilled = client.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidInvoices = client.invoices.filter((inv) => inv.status === 'paid');
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outstanding = totalBilled - totalPaid;

      return {
        ...client,
        totalBilled,
        totalPaid,
        outstanding,
      };
    });

    return NextResponse.json(clientsWithSums);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        gstNumber: body.gstNumber || null,
        address: body.address || null,
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
