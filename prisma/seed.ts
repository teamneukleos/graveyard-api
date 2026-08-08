import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Campaign',
    slug: 'campaign',
    description: 'Full campaign ideas that never launched',
    sortOrder: 1,
  },
  {
    name: 'Branding',
    slug: 'branding',
    description: 'Identity and brand systems left on the shelf',
    sortOrder: 2,
  },
  {
    name: 'Digital',
    slug: 'digital',
    description: 'Digital products, sites, and experiences never shipped',
    sortOrder: 3,
  },
  {
    name: 'Film',
    slug: 'film',
    description: 'Films and commercials that never went into production',
    sortOrder: 4,
  },
  {
    name: 'Social Media',
    slug: 'social-media',
    description: 'Social concepts and content that stayed unpublished',
    sortOrder: 5,
  },
  {
    name: 'Copywriting',
    slug: 'copywriting',
    description: 'Lines, scripts, and copy that never saw daylight',
    sortOrder: 6,
  },
  {
    name: 'Motion',
    slug: 'motion',
    description: 'Motion design and animation that never shipped',
    sortOrder: 7,
  },
  {
    name: 'Illustration',
    slug: 'illustration',
    description: 'Illustration work that remained unseen',
    sortOrder: 8,
  },
  {
    name: 'Innovation',
    slug: 'innovation',
    description: 'Innovative concepts that never made it to market',
    sortOrder: 9,
  },
  {
    name: 'Student Work',
    slug: 'student-work',
    description: 'Exceptional student work that never got its moment',
    sortOrder: 10,
  },
];

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: category,
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories`);
}

async function seedSuperAdmin() {
  const email = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@graveyard.local'
  )
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin1!';
  const name = (process.env.SEED_ADMIN_NAME ?? 'Super Admin').trim();
  const resetPassword =
    (process.env.SEED_ADMIN_RESET_PASSWORD ?? 'true').toLowerCase() === 'true';

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
      },
    });
    console.log(
      `Seeded super admin ${email} (password from SEED_ADMIN_PASSWORD)`,
    );
    return;
  }

  await prisma.user.update({
    where: { email },
    data: {
      name,
      role: UserRole.SUPER_ADMIN,
      ...(resetPassword ? { passwordHash } : {}),
    },
  });

  console.log(
    resetPassword
      ? `Updated super admin ${email} (role + password reset)`
      : `Ensured super admin ${email} (role only; password unchanged)`,
  );
}

async function main() {
  await seedCategories();
  await seedSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
