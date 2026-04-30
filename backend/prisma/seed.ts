import "dotenv/config";
import {
  PrismaClient,
  InvoiceStatus,
  FollowUpChannel,
  FollowUpTemplate,
  FollowUpStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subtractDays = (date: Date, days: number): Date => addDays(date, -days);

const now = new Date();

async function main() {
  console.log("Seeding database...");

  await prisma.followUpLog.deleteMany();
  await prisma.followUpSchedule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data.");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.create({
    data: {
      name: "Tunde Adeyemi",
      email: "tunde@oyapay.test",
      password: hashedPassword,
      businessName: "Adeyemi Creative Studio",
      phone: "08012345678",
    },
  });

  console.log(`Created user: ${user.email}`);

  // ─── CLIENT 1: Model client — always pays on time ────────────────────────────

  const clientOnTime = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Amaka Obi",
      email: "amaka@brighttech.ng",
      phone: "08023456789",
      address: "14 Admiralty Way, Lekki, Lagos",
    },
  });

  // Invoice 1a: Paid early
  const inv1a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-001",
      title: "Brand Identity Design",
      userId: user.id,
      clientId: clientOnTime.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 60),
      dueDate: subtractDays(now, 30),
      currency: "NGN",
      subtotal: 350000,
      tax: 0,
      total: 350000,
      sentAt: subtractDays(now, 60),
      paidAt: subtractDays(now, 33),
      items: {
        create: [
          {
            description: "Logo design (3 concepts)",
            quantity: 1,
            unitPrice: 150000,
            total: 150000,
          },
          {
            description: "Brand style guide",
            quantity: 1,
            unitPrice: 120000,
            total: 120000,
          },
          {
            description: "Business card design",
            quantity: 1,
            unitPrice: 80000,
            total: 80000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1a.id,
      amount: 350000,
      method: "bank_transfer",
      reference: "TRF-AMAKA-001",
      note: "Full payment received",
      paidAt: subtractDays(now, 33),
    },
  });

  // Invoice 1b: Paid on time
  const inv1b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-002",
      title: "Website UI Design",
      userId: user.id,
      clientId: clientOnTime.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 45),
      dueDate: subtractDays(now, 15),
      currency: "NGN",
      subtotal: 480000,
      tax: 0,
      total: 480000,
      sentAt: subtractDays(now, 45),
      paidAt: subtractDays(now, 15),
      items: {
        create: [
          {
            description: "Homepage design",
            quantity: 1,
            unitPrice: 180000,
            total: 180000,
          },
          {
            description: "Interior pages (5)",
            quantity: 5,
            unitPrice: 60000,
            total: 300000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1b.id,
      amount: 480000,
      method: "paystack",
      reference: "PSK-AMAKA-002",
      paidAt: subtractDays(now, 15),
    },
  });

  // Invoice 1c: Currently pending, due in 7 days
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-003",
      title: "Social Media Kit",
      userId: user.id,
      clientId: clientOnTime.id,
      status: InvoiceStatus.PENDING,
      issueDate: subtractDays(now, 7),
      dueDate: addDays(now, 7),
      currency: "NGN",
      subtotal: 120000,
      tax: 0,
      total: 120000,
      sentAt: subtractDays(now, 7),
      items: {
        create: [
          {
            description: "Instagram templates (10)",
            quantity: 10,
            unitPrice: 8000,
            total: 80000,
          },
          {
            description: "Facebook banner designs",
            quantity: 5,
            unitPrice: 8000,
            total: 40000,
          },
        ],
      },
    },
  });

  console.log(
    `Created client: ${clientOnTime.name} (on-time payer, 2 paid, 1 pending)`,
  );

  // ─── CLIENT 2: Sometimes late payer ──────────────────────────────────────────

  const clientSometimesLate = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Emeka Nwosu",
      email: "emeka@nexusmedia.ng",
      phone: "08034567890",
      address: "Plot 5, Wuse Zone 4, Abuja",
    },
  });

  // Invoice 2a: Paid 10 days late
  const inv2a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-004",
      title: "Product Photography",
      userId: user.id,
      clientId: clientSometimesLate.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 90),
      dueDate: subtractDays(now, 60),
      currency: "NGN",
      subtotal: 200000,
      tax: 0,
      total: 200000,
      sentAt: subtractDays(now, 90),
      paidAt: subtractDays(now, 50),
      items: {
        create: [
          {
            description: "Product shoot (20 items)",
            quantity: 20,
            unitPrice: 8000,
            total: 160000,
          },
          {
            description: "Editing and retouching",
            quantity: 1,
            unitPrice: 40000,
            total: 40000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2a.id,
      amount: 200000,
      method: "bank_transfer",
      reference: "TRF-EMEKA-001",
      paidAt: subtractDays(now, 50),
    },
  });

  // Invoice 2b: Paid on time
  const inv2b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-005",
      title: "Video Editing — Q3 Reel",
      userId: user.id,
      clientId: clientSometimesLate.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 70),
      dueDate: subtractDays(now, 40),
      currency: "NGN",
      subtotal: 150000,
      tax: 0,
      total: 150000,
      sentAt: subtractDays(now, 70),
      paidAt: subtractDays(now, 40),
      items: {
        create: [
          {
            description: "Video editing (3 min reel)",
            quantity: 1,
            unitPrice: 100000,
            total: 100000,
          },
          {
            description: "Motion graphics",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2b.id,
      amount: 150000,
      method: "paystack",
      reference: "PSK-EMEKA-002",
      paidAt: subtractDays(now, 40),
    },
  });

  // Invoice 2c: Partial payment — 60% paid, rest overdue by 5 days
  const inv2c = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-006",
      title: "Annual Report Design",
      userId: user.id,
      clientId: clientSometimesLate.id,
      status: InvoiceStatus.PARTIAL,
      issueDate: subtractDays(now, 20),
      dueDate: subtractDays(now, 5),
      currency: "NGN",
      subtotal: 300000,
      tax: 0,
      total: 300000,
      sentAt: subtractDays(now, 20),
      items: {
        create: [
          {
            description: "Annual report layout (40 pages)",
            quantity: 40,
            unitPrice: 5000,
            total: 200000,
          },
          {
            description: "Cover design",
            quantity: 1,
            unitPrice: 60000,
            total: 60000,
          },
          {
            description: "Infographics (8)",
            quantity: 8,
            unitPrice: 5000,
            total: 40000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2c.id,
      amount: 180000,
      method: "bank_transfer",
      reference: "TRF-EMEKA-003",
      note: "Part payment",
      paidAt: subtractDays(now, 6),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.EMAIL,
      message: `Invoice INV-SEED-006 from Adeyemi Creative Studio`,
      status: "SENT",
      sentAt: subtractDays(now, 20),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.WHATSAPP,
      message: `Hi Emeka, a reminder that invoice INV-SEED-006 for NGN 300,000 is due on ${subtractDays(now, 5).toLocaleDateString("en-NG")}.`,
      status: "SENT",
      sentAt: subtractDays(now, 8),
    },
  });

  await prisma.followUpSchedule.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.FIRST_OVERDUE,
      scheduledAt: addDays(now, 1),
      status: FollowUpStatus.PENDING,
    },
  });

  await prisma.followUpSchedule.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.WHATSAPP,
      template: FollowUpTemplate.SECOND_OVERDUE,
      scheduledAt: addDays(now, 7),
      status: FollowUpStatus.PENDING,
    },
  });

  console.log(
    `Created client: ${clientSometimesLate.name} (sometimes late, 2 paid, 1 partial)`,
  );

  // ─── CLIENT 3: Consistently late payer ───────────────────────────────────────

  const clientLate = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Biodun Fasanya",
      email: "biodun@fasanyagroup.com",
      phone: "08045678901",
      address: "22 Kofo Abayomi Street, Victoria Island, Lagos",
    },
  });

  // Invoice 3a: Paid 18 days late
  const inv3a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-007",
      title: "Corporate Event Coverage",
      userId: user.id,
      clientId: clientLate.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 120),
      dueDate: subtractDays(now, 90),
      currency: "NGN",
      subtotal: 500000,
      tax: 0,
      total: 500000,
      sentAt: subtractDays(now, 120),
      paidAt: subtractDays(now, 72),
      items: {
        create: [
          {
            description: "Event photography (8 hours)",
            quantity: 8,
            unitPrice: 35000,
            total: 280000,
          },
          {
            description: "Event videography (8 hours)",
            quantity: 8,
            unitPrice: 25000,
            total: 200000,
          },
          {
            description: "Same-day highlight reel",
            quantity: 1,
            unitPrice: 20000,
            total: 20000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv3a.id,
      amount: 500000,
      method: "bank_transfer",
      reference: "TRF-BIODUN-001",
      paidAt: subtractDays(now, 72),
    },
  });

  // Invoice 3b: Paid 22 days late
  const inv3b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-008",
      title: "Office Interior Photography",
      userId: user.id,
      clientId: clientLate.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 80),
      dueDate: subtractDays(now, 50),
      currency: "NGN",
      subtotal: 180000,
      tax: 0,
      total: 180000,
      sentAt: subtractDays(now, 80),
      paidAt: subtractDays(now, 28),
      items: {
        create: [
          {
            description: "Architectural photography (half day)",
            quantity: 1,
            unitPrice: 120000,
            total: 120000,
          },
          {
            description: "Post-processing (30 images)",
            quantity: 30,
            unitPrice: 2000,
            total: 60000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv3b.id,
      amount: 180000,
      method: "cash",
      reference: "CASH-BIODUN-002",
      paidAt: subtractDays(now, 28),
    },
  });

  // Invoice 3c: Currently overdue by 14 days — has been chased twice
  const inv3c = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-009",
      title: "Executive Headshots",
      userId: user.id,
      clientId: clientLate.id,
      status: InvoiceStatus.OVERDUE,
      issueDate: subtractDays(now, 44),
      dueDate: subtractDays(now, 14),
      currency: "NGN",
      subtotal: 250000,
      tax: 0,
      total: 250000,
      sentAt: subtractDays(now, 44),
      items: {
        create: [
          {
            description: "Executive headshots (5 subjects)",
            quantity: 5,
            unitPrice: 40000,
            total: 200000,
          },
          {
            description: "Retouching and delivery",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
          },
        ],
      },
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.EMAIL,
      message: `Invoice INV-SEED-009 from Adeyemi Creative Studio`,
      status: "SENT",
      sentAt: subtractDays(now, 44),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.WHATSAPP,
      message: `Hi Biodun, a reminder that invoice INV-SEED-009 for NGN 250,000 is due on ${subtractDays(now, 14).toLocaleDateString("en-NG")}.`,
      status: "SENT",
      sentAt: subtractDays(now, 17),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.EMAIL,
      message: `Invoice INV-SEED-009 is now overdue`,
      status: "SENT",
      sentAt: subtractDays(now, 13),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.WHATSAPP,
      message: `Hi Biodun, invoice INV-SEED-009 for NGN 250,000 was due on ${subtractDays(now, 14).toLocaleDateString("en-NG")} and is now overdue. Please arrange payment.`,
      status: "SENT",
      sentAt: subtractDays(now, 13),
    },
  });

  await prisma.followUpSchedule.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.SECOND_OVERDUE,
      scheduledAt: addDays(subtractDays(now, 14), 7),
      status: FollowUpStatus.SENT,
      sentAt: subtractDays(now, 7),
    },
  });

  await prisma.followUpSchedule.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.WHATSAPP,
      template: FollowUpTemplate.FINAL_NOTICE,
      scheduledAt: addDays(now, 0),
      status: FollowUpStatus.PENDING,
    },
  });

  await prisma.followUpSchedule.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.FINAL_NOTICE,
      scheduledAt: addDays(now, 0),
      status: FollowUpStatus.PENDING,
    },
  });

  console.log(
    `Created client: ${clientLate.name} (consistently late, 2 paid, 1 overdue 14d)`,
  );

  // ─── CLIENT 4: Severely overdue — no phone, email only ───────────────────────

  const clientGhost = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Chukwuemeka Eze",
      email: "c.eze@ezeconsults.ng",
      address: "Block C, Festac Town, Lagos",
    },
  });

  // Invoice 4a: Paid very late (30 days)
  const inv4a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-010",
      title: "Brand Consultation (Phase 1)",
      userId: user.id,
      clientId: clientGhost.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 150),
      dueDate: subtractDays(now, 120),
      currency: "NGN",
      subtotal: 100000,
      tax: 0,
      total: 100000,
      sentAt: subtractDays(now, 150),
      paidAt: subtractDays(now, 90),
      items: {
        create: [
          {
            description: "Brand audit and strategy session",
            quantity: 1,
            unitPrice: 100000,
            total: 100000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv4a.id,
      amount: 100000,
      method: "bank_transfer",
      reference: "TRF-EZE-001",
      paidAt: subtractDays(now, 90),
    },
  });

  // Invoice 4b: Severely overdue — 35 days past due, never paid, final notice sent
  const inv4b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-011",
      title: "Brand Consultation (Phase 2)",
      userId: user.id,
      clientId: clientGhost.id,
      status: InvoiceStatus.OVERDUE,
      issueDate: subtractDays(now, 65),
      dueDate: subtractDays(now, 35),
      currency: "NGN",
      subtotal: 150000,
      tax: 0,
      total: 150000,
      sentAt: subtractDays(now, 65),
      notes: "As agreed, payment due 30 days from invoice date.",
      items: {
        create: [
          {
            description: "Competitive analysis report",
            quantity: 1,
            unitPrice: 80000,
            total: 80000,
          },
          {
            description: "Brand positioning workshop",
            quantity: 1,
            unitPrice: 70000,
            total: 70000,
          },
        ],
      },
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      message: `Invoice INV-SEED-011 from Adeyemi Creative Studio`,
      status: "SENT",
      sentAt: subtractDays(now, 65),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      message: `Reminder: Invoice INV-SEED-011 due soon`,
      status: "SENT",
      sentAt: subtractDays(now, 38),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      message: `Invoice INV-SEED-011 is now overdue`,
      status: "SENT",
      sentAt: subtractDays(now, 34),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      message: `Second notice: Invoice INV-SEED-011 overdue`,
      status: "SENT",
      sentAt: subtractDays(now, 28),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      message: `Final notice: Invoice INV-SEED-011`,
      status: "SENT",
      sentAt: subtractDays(now, 21),
    },
  });

  await prisma.followUpSchedule.createMany({
    data: [
      {
        invoiceId: inv4b.id,
        channel: FollowUpChannel.EMAIL,
        template: FollowUpTemplate.PRE_DUE_REMINDER,
        scheduledAt: subtractDays(now, 38),
        status: FollowUpStatus.SENT,
        sentAt: subtractDays(now, 38),
      },
      {
        invoiceId: inv4b.id,
        channel: FollowUpChannel.EMAIL,
        template: FollowUpTemplate.FIRST_OVERDUE,
        scheduledAt: subtractDays(now, 34),
        status: FollowUpStatus.SENT,
        sentAt: subtractDays(now, 34),
      },
      {
        invoiceId: inv4b.id,
        channel: FollowUpChannel.EMAIL,
        template: FollowUpTemplate.SECOND_OVERDUE,
        scheduledAt: subtractDays(now, 28),
        status: FollowUpStatus.SENT,
        sentAt: subtractDays(now, 28),
      },
      {
        invoiceId: inv4b.id,
        channel: FollowUpChannel.EMAIL,
        template: FollowUpTemplate.FINAL_NOTICE,
        scheduledAt: subtractDays(now, 21),
        status: FollowUpStatus.SENT,
        sentAt: subtractDays(now, 21),
      },
    ],
  });

  // Invoice 4c: Draft — not yet sent
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-012",
      title: "Brand Guidelines Document",
      userId: user.id,
      clientId: clientGhost.id,
      status: InvoiceStatus.DRAFT,
      issueDate: now,
      dueDate: addDays(now, 14),
      currency: "NGN",
      subtotal: 200000,
      tax: 0,
      total: 200000,
      items: {
        create: [
          {
            description: "Brand guidelines (typography, colour, usage)",
            quantity: 1,
            unitPrice: 200000,
            total: 200000,
          },
        ],
      },
    },
  });

  console.log(
    `Created client: ${clientGhost.name} (severely overdue, no phone, full chase history)`,
  );

  // ─── CLIENT 5: New client — no history, single pending invoice ────────────────

  const clientNew = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Ngozi Adaora",
      email: "ngozi@adaoracouture.ng",
      phone: "08056789012",
      address: "Shop 4, Balogun Market Complex, Lagos Island",
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-013",
      title: "E-commerce Photography",
      userId: user.id,
      clientId: clientNew.id,
      status: InvoiceStatus.PENDING,
      issueDate: subtractDays(now, 3),
      dueDate: addDays(now, 11),
      currency: "NGN",
      subtotal: 220000,
      tax: 0,
      total: 220000,
      sentAt: subtractDays(now, 3),
      items: {
        create: [
          {
            description: "Fashion product photography (50 items)",
            quantity: 50,
            unitPrice: 3500,
            total: 175000,
          },
          {
            description: "Background removal and web optimisation",
            quantity: 50,
            unitPrice: 900,
            total: 45000,
          },
        ],
      },
    },
  });

  console.log(
    `Created client: ${clientNew.name} (new client, 1 pending invoice)`,
  );

  // ─── CLIENT 6: Cancelled invoice + one paid ───────────────────────────────────

  const clientMixed = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Segun Bello",
      email: "segun@belloproductions.ng",
      phone: "08067890123",
      address: "15 Allen Avenue, Ikeja, Lagos",
    },
  });

  const inv6a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-014",
      title: "Music Video Production",
      userId: user.id,
      clientId: clientMixed.id,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 55),
      dueDate: subtractDays(now, 25),
      currency: "NGN",
      subtotal: 800000,
      tax: 0,
      total: 800000,
      sentAt: subtractDays(now, 55),
      paidAt: subtractDays(now, 24),
      items: {
        create: [
          {
            description: "Pre-production planning",
            quantity: 1,
            unitPrice: 100000,
            total: 100000,
          },
          {
            description: "Shoot day (8 hours crew)",
            quantity: 1,
            unitPrice: 400000,
            total: 400000,
          },
          {
            description: "Post-production and colour grade",
            quantity: 1,
            unitPrice: 300000,
            total: 300000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv6a.id,
      amount: 800000,
      method: "bank_transfer",
      reference: "TRF-SEGUN-001",
      paidAt: subtractDays(now, 24),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-015",
      title: "Podcast Studio Rental",
      userId: user.id,
      clientId: clientMixed.id,
      status: InvoiceStatus.CANCELLED,
      issueDate: subtractDays(now, 20),
      dueDate: addDays(now, 10),
      currency: "NGN",
      subtotal: 50000,
      tax: 0,
      total: 50000,
      sentAt: subtractDays(now, 20),
      items: {
        create: [
          {
            description: "Studio rental (4 hours)",
            quantity: 4,
            unitPrice: 12500,
            total: 50000,
          },
        ],
      },
    },
  });

  console.log(`Created client: ${clientMixed.name} (1 paid, 1 cancelled)`);

  console.log("\n─────────────────────────────────────────────");
  console.log("Seed complete.");
  console.log("\nLogin credentials:");
  console.log("  Email:    tunde@oyapay.test");
  console.log("  Password: password123");
  console.log("\nClients seeded:");
  console.log("  Amaka Obi         — on-time payer, 2 paid + 1 pending");
  console.log(
    "  Emeka Nwosu       — sometimes late, 2 paid + 1 partial (5d overdue)",
  );
  console.log(
    "  Biodun Fasanya    — consistently late, 2 paid + 1 overdue (14d)",
  );
  console.log(
    "  Chukwuemeka Eze   — ghost/severely overdue (35d), full chase log, 1 draft",
  );
  console.log("  Ngozi Adaora      — new client, 1 pending");
  console.log("  Segun Bello       — 1 paid, 1 cancelled");
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
