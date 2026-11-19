import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FS-04 database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-tenant' },
    update: {},
    create: {
      slug: 'demo-tenant',
      name: 'Demo Tenant',
      subscriptionTier: 'FREE',
    },
  });

  console.log('✅ Created demo tenant:', tenant.name);

  const user = await prisma.user.upsert({
    where: { email_tenantId: { email: 'demo@fs04.local', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'demo@fs04.local',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: 'OWNER',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created demo user:', user.email);

  const project = await prisma.project.create({
    data: {
      key: 'DEMO',
      name: 'Demo Project',
      description: 'A demo project for FS-04',
      visibility: 'PRIVATE',
      tenantId: tenant.id,
      ownerId: user.id,
    },
  });

  console.log('✅ Created demo project:', project.key);

  await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: project.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Added user as project owner');

  const board = await prisma.board.create({
    data: {
      name: 'Sprint Board',
      type: 'scrum',
      projectId: project.id,
    },
  });

  console.log('✅ Created demo board:', board.name);

  const columns = await Promise.all([
    prisma.column.create({ data: { name: 'Backlog', position: 0, color: '#6366f1', boardId: board.id } }),
    prisma.column.create({ data: { name: 'To Do', position: 1, color: '#3b82f6', boardId: board.id } }),
    prisma.column.create({ data: { name: 'In Progress', position: 2, color: '#f59e0b', boardId: board.id } }),
    prisma.column.create({ data: { name: 'In Review', position: 3, color: '#10b981', boardId: board.id } }),
    prisma.column.create({ data: { name: 'Done', position: 4, color: '#22c55e', boardId: board.id } }),
  ]);

  console.log('✅ Created board columns');

  await prisma.issue.create({
    data: {
      key: 'DEMO-1',
      title: 'Welcome to FS-04',
      description: 'This is a demo issue. Explore the project management features!',
      type: 'TASK',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      boardId: board.id,
      columnId: columns[1].id,
      reporterId: user.id,
      assigneeId: user.id,
    },
  });

  console.log('✅ Created demo issue');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });