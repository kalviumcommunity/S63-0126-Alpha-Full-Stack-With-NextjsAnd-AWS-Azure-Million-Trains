import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const seedUsers = [
    {
      id: "seed-user-alice",
      fullName: "Alice Engineer",
      email: "alice@example.com",
    },
    {
      id: "seed-user-bob",
      fullName: "Bob Operator",
      email: "bob@example.com",
    },
  ];

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        fullName: user.fullName,
        email: user.email,
        password: passwordHash,
      },
      create: {
        ...user,
        password: passwordHash,
      },
    });
  }

  const contactRequests = [
    {
      id: "seed-contact-ops",
      category: "Operations",
      hasTicket: true,
      referenceCode: "OPS-001",
      message: "Need clarification on platform changes for Train 12049.",
      attachmentUrl: null,
      fullName: "Alice Engineer",
      email: "alice@example.com",
    },
    {
      id: "seed-contact-support",
      category: "Support",
      hasTicket: false,
      referenceCode: "SUP-002",
      message: "Please reset the crew portal credentials.",
      attachmentUrl: null,
      fullName: "Bob Operator",
      email: "bob@example.com",
    },
  ];

  for (const request of contactRequests) {
    await prisma.contactRequest.upsert({
      where: { id: request.id },
      update: request,
      create: request,
    });
  }

  console.log("Seed data inserted successfully\n- Users: %d\n- Contact requests: %d", seedUsers.length, contactRequests.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
