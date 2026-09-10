import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (category && category !== 'All') where.category = category;
    if (projectId && projectId !== 'All') where.projectId = projectId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { name: true },
        },
      },
    });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Ensure empty string is converted to null for foreign key constraints
    const validProjectId = body.projectId && body.projectId.trim() !== '' ? body.projectId : null;

    const document = await prisma.document.create({
      data: {
        name: body.name,
        category: body.category,
        projectId: validProjectId,
        filePath: body.filePath,
        fileSize: body.fileSize || null,
        fileType: body.fileType || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
