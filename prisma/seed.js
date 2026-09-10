const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultMaterials = [
  { name: 'OPC Cement 53 Grade', category: 'cement', unit: 'bags', minimumStock: 50, lastPrice: 38000, hsnCode: '2523', gstRate: 28 },
  { name: 'PPC Cement', category: 'cement', unit: 'bags', minimumStock: 50, lastPrice: 36000, hsnCode: '2523', gstRate: 28 },
  { name: 'River Sand', category: 'sand', unit: 'brass', minimumStock: 5, lastPrice: 1500000, hsnCode: '2505', gstRate: 5 },
  { name: 'M-Sand', category: 'sand', unit: 'brass', minimumStock: 5, lastPrice: 1200000, hsnCode: '2505', gstRate: 5 },
  { name: 'Stone Aggregate 20mm', category: 'aggregate', unit: 'brass', minimumStock: 5, lastPrice: 1800000, hsnCode: '2517', gstRate: 5 },
  { name: 'Stone Aggregate 10mm', category: 'aggregate', unit: 'brass', minimumStock: 3, lastPrice: 2000000, hsnCode: '2517', gstRate: 5 },
  { name: 'TMT Steel Bar 8mm', category: 'steel', unit: 'kg', minimumStock: 500, lastPrice: 5500, hsnCode: '7214', gstRate: 18 },
  { name: 'TMT Steel Bar 10mm', category: 'steel', unit: 'kg', minimumStock: 500, lastPrice: 5500, hsnCode: '7214', gstRate: 18 },
  { name: 'TMT Steel Bar 12mm', category: 'steel', unit: 'kg', minimumStock: 500, lastPrice: 5400, hsnCode: '7214', gstRate: 18 },
  { name: 'TMT Steel Bar 16mm', category: 'steel', unit: 'kg', minimumStock: 300, lastPrice: 5400, hsnCode: '7214', gstRate: 18 },
  { name: 'Red Bricks', category: 'bricks', unit: 'numbers', minimumStock: 5000, lastPrice: 800, hsnCode: '6901', gstRate: 5 },
  { name: 'Fly Ash Bricks', category: 'bricks', unit: 'numbers', minimumStock: 5000, lastPrice: 600, hsnCode: '6901', gstRate: 5 },
  { name: 'AAC Blocks', category: 'bricks', unit: 'numbers', minimumStock: 1000, lastPrice: 5500, hsnCode: '6810', gstRate: 12 },
  { name: 'Ceramic Floor Tiles', category: 'tiles', unit: 'boxes', minimumStock: 50, lastPrice: 4500, hsnCode: '6908', gstRate: 18 },
  { name: 'Vitrified Tiles', category: 'tiles', unit: 'boxes', minimumStock: 50, lastPrice: 6000, hsnCode: '6908', gstRate: 18 },
  { name: 'Exterior Paint', category: 'paint', unit: 'litres', minimumStock: 50, lastPrice: 25000, hsnCode: '3209', gstRate: 18 },
  { name: 'Interior Paint', category: 'paint', unit: 'litres', minimumStock: 50, lastPrice: 20000, hsnCode: '3209', gstRate: 18 },
  { name: 'PVC Pipes 4 inch', category: 'pipes', unit: 'metres', minimumStock: 100, lastPrice: 15000, hsnCode: '3917', gstRate: 18 },
  { name: 'CPVC Pipes', category: 'pipes', unit: 'metres', minimumStock: 100, lastPrice: 8000, hsnCode: '3917', gstRate: 18 },
  { name: 'Electrical Wire 1.5 sq mm', category: 'electrical', unit: 'metres', minimumStock: 200, lastPrice: 1500, hsnCode: '8544', gstRate: 18 },
  { name: 'Electrical Wire 2.5 sq mm', category: 'electrical', unit: 'metres', minimumStock: 200, lastPrice: 2500, hsnCode: '8544', gstRate: 18 },
  { name: 'Teak Wood', category: 'wood', unit: 'cft', minimumStock: 20, lastPrice: 350000, hsnCode: '4407', gstRate: 18 },
  { name: 'Plywood 19mm', category: 'wood', unit: 'numbers', minimumStock: 10, lastPrice: 12000000, hsnCode: '4412', gstRate: 18 },
  { name: 'Binding Wire', category: 'other', unit: 'kg', minimumStock: 50, lastPrice: 6000, hsnCode: '7217', gstRate: 18 },
  { name: 'Waterproofing Chemical', category: 'other', unit: 'kg', minimumStock: 20, lastPrice: 8000, hsnCode: '3214', gstRate: 18 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create default materials
  for (const material of defaultMaterials) {
    await prisma.material.create({ data: material });
  }
  console.log(`✅ Created ${defaultMaterials.length} default materials`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
