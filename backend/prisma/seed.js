import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@flow.app' },
    update: { isVerified: true },
    create: {
      email: 'demo@flow.app',
      name: 'Demo User',
      password: hashedPassword,
      isVerified: true,
    },
  });

  // Create Friend User
  const friendUser = await prisma.user.upsert({
    where: { email: 'friend@flow.app' },
    update: { isVerified: true },
    create: {
      email: 'friend@flow.app',
      name: 'Alex Friend',
      password: hashedPassword,
      isVerified: true,
    },
  });

  const now = new Date();
  const expenses = [];

  // 4 monthly rent payments
  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 30));
    expenses.push({
      userId: demoUser.id,
      amount: 1200 + (Math.random() * 20 - 10), // slight variation
      category: 'Rent',
      description: 'Monthly rent',
      date: d,
      isRecurring: true,
      recurringInterval: 'monthly'
    });
  }

  // 4 weekly grocery expenses
  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 7));
    expenses.push({
      userId: demoUser.id,
      amount: 85 + (Math.random() * 10 - 5),
      category: 'Food',
      description: 'Weekly groceries',
      date: d,
      isRecurring: true,
      recurringInterval: 'weekly'
    });
  }

  // Other varied expenses
  const categories = ['Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Food'];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 90)); // random within last 90 days
    expenses.push({
      userId: demoUser.id,
      amount: Math.floor(Math.random() * 150) + 10,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Random expense ${i}`,
      date: d
    });
  }

  // Insert expenses
  for (const exp of expenses) {
    await prisma.expense.create({ data: exp });
  }

  // Fetch some expenses to create shared expenses
  const savedExpenses = await prisma.expense.findMany({ where: { userId: demoUser.id }, take: 3 });

  for (let i = 0; i < savedExpenses.length; i++) {
    const exp = savedExpenses[i];
    const sharedExp = await prisma.sharedExpense.create({
      data: {
        expenseId: exp.id,
        createdByUserId: demoUser.id,
        participants: {
          create: [
            { userId: friendUser.id, amountOwed: exp.amount / 2, settled: false }
          ]
        }
      }
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
