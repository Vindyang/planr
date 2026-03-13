import { prisma } from "../lib/prisma"

async function verifyAdminAccounts() {
  console.log("🔍 Verifying admin accounts...\n")

  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN", "COORDINATOR"],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
    },
    orderBy: {
      role: "desc",
    },
  })

  if (admins.length === 0) {
    console.log("❌ No admin accounts found!")
    console.log("Run: bun run prisma db seed")
    return
  }

  console.log(`✅ Found ${admins.length} admin account(s):\n`)

  admins.forEach((admin) => {
    console.log(`${admin.role} - ${admin.name}`)
    console.log(`  Email: ${admin.email}`)
    console.log(`  Verified: ${admin.emailVerified ? "✅" : "❌"}`)
    console.log(`  ID: ${admin.id}\n`)
  })

  await prisma.$disconnect()
}

verifyAdminAccounts().catch(console.error)
