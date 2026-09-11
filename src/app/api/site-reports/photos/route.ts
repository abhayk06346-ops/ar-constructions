import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const date = searchParams.get('date');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (date) where.date = new Date(date);

  try {
    const data = await prisma.sitePhoto.findMany({
      where,
      include: { project: true },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching site photos", error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.projectId || body.projectId.trim() === '') {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 });
    }
    
    const item = await prisma.sitePhoto.create({
      data: {
        projectId: body.projectId,
        date: body.date || new Date().toISOString().split('T')[0],
        caption: body.caption || body.description || '',
        tags: body.tags || '',
        filePath: body.filePath,
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error creating site photo", error);
    return NextResponse.json({ error: error.message || 'Failed to upload photo' }, { status: 500 });
  }
}
