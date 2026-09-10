import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        _count: {
          select: {
            phases: true,
            changeOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Clean up empty clientId string
    if (body.clientId === '') {
      delete body.clientId;
    }
    
    const defaultPhases = [
      'Foundation', 'Structure', 'Brickwork', 'Plastering', 
      'Electrical & Plumbing', 'Finishing', 'Handover'
    ];

    const project = await prisma.project.create({
      data: {
        ...body,
        phases: {
          create: defaultPhases.map((name, index) => ({
            name,
            sortOrder: index,
            status: 'pending',
            progress: 0,
          }))
        }
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
