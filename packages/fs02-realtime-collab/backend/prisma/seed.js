import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FS-02 database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@fs02.local' },
    update: {},
    create: {
      email: 'demo@fs02.local',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      color: '#6366f1',
    },
  });

  console.log('✅ Created demo user:', user.email);

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'personal-demo' },
    update: {},
    create: {
      name: 'Personal Workspace',
      slug: 'personal-demo',
      isPersonal: true,
      ownerId: user.id,
      color: '#6366f1',
    },
  });

  console.log('✅ Created personal workspace:', workspace.name);

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Added user as workspace owner');

  const doc = await prisma.document.create({
    data: {
      title: 'Welcome to FS-02',
      type: 'DOCUMENT',
      workspaceId: workspace.id,
      ownerId: user.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome to FS-02 Real-Time Collaborative Workspace' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is a demo document. Start collaborating in real-time!' },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created demo document:', doc.title);

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