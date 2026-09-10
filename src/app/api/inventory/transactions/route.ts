import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const materialId = searchParams.get('materialId');
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (type) where.type = type;
    if (materialId) where.materialId = materialId;
    if (projectId) where.projectId = projectId;

    const transactions = await prisma.stockTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        material: { select: { id: true, name: true, unit: true } },
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } }
      }
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, type, quantity, pricePerUnit, projectId, vendorId, date, notes } = body;
    
    // totalAmount in paise
    const totalAmount = quantity * pricePerUnit;

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create the stock transaction
      const newTx = await tx.stockTransaction.create({
        data: {
          materialId,
          type,
          quantity: Number(quantity),
          pricePerUnit: Number(pricePerUnit),
          totalAmount,
          projectId,
          vendorId,
          date: date || new Date().toISOString().split('T')[0],
          notes
        }
      });

      // 2. Find the material to update
      const material = await tx.material.findUnique({
        where: { id: materialId }
      });

      if (!material) {
        throw new Error('Material not found');
      }

      // 3. Update material stock and lastPrice
      if (type === 'stock_in') {
        await tx.material.update({
          where: { id: materialId },
          data: {
            currentStock: material.currentStock + Number(quantity),
            lastPrice: Number(pricePerUnit)
          }
        });
      } else if (type === 'stock_out') {
        await tx.material.update({
          where: { id: materialId },
          data: {
            currentStock: material.currentStock - Number(quantity)
          }
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
