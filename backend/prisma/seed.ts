import "dotenv/config";
import {
  PrismaClient,
  InvoiceStatus,
  InvoiceType,
  ProjectStatus,
  FollowUpChannel,
  FollowUpTemplate,
  FollowUpStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subtractDays = (date: Date, days: number): Date => addDays(date, -days);

async function main() {
  const now = new Date();

  await prisma.payLinkClick.deleteMany();
  await prisma.emailOpen.deleteMany();
  await prisma.followUpLog.deleteMany();
  await prisma.followUpSchedule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

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

  const clientOnTime = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Amaka Obi",
      email: "amaka@brighttech.ng",
      phone: "08023456789",
      address: "14 Admiralty Way, Lekki, Lagos",
    },
  });

  const projectAmaka = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: clientOnTime.id,
      name: "Brand & Web Design Package",
      totalValue: 950000,
      paymentTermsDays: 14,
      status: ProjectStatus.COMPLETED,
    },
  });

  const inv1a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-001",
      title: "Brand Identity Design — Deposit",
      userId: user.id,
      clientId: clientOnTime.id,
      projectId: projectAmaka.id,
      invoiceType: InvoiceType.DEPOSIT,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 60),
      dueDate: subtractDays(now, 55),
      currency: "NGN",
      subtotal: 350000,
      tax: 0,
      total: 350000,
      sentAt: subtractDays(now, 60),
      paidAt: subtractDays(now, 58),
      paystackRef: "OYAPAY-INV-SEED-001-SEED",
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
      note: "Deposit received",
      paidAt: subtractDays(now, 58),
    },
  });

  const inv1b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-002",
      title: "Website UI Design — Milestone",
      userId: user.id,
      clientId: clientOnTime.id,
      projectId: projectAmaka.id,
      invoiceType: InvoiceType.MILESTONE,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 45),
      dueDate: subtractDays(now, 31),
      currency: "NGN",
      subtotal: 480000,
      tax: 0,
      total: 480000,
      sentAt: subtractDays(now, 45),
      paidAt: subtractDays(now, 31),
      paystackRef: "OYAPAY-INV-SEED-002-SEED",
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
      paidAt: subtractDays(now, 31),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-003",
      title: "Social Media Kit — Final Payment",
      userId: user.id,
      clientId: clientOnTime.id,
      projectId: projectAmaka.id,
      invoiceType: InvoiceType.FINAL,
      status: InvoiceStatus.PENDING,
      issueDate: subtractDays(now, 7),
      dueDate: addDays(now, 7),
      currency: "NGN",
      subtotal: 120000,
      tax: 0,
      total: 120000,
      sentAt: subtractDays(now, 7),
      paystackRef: "OYAPAY-INV-SEED-003-SEED",
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

  const clientSometimesLate = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Emeka Nwosu",
      email: "emeka@nexusmedia.ng",
      phone: "08034567890",
      address: "Plot 5, Wuse Zone 4, Abuja",
    },
  });

  const projectEmeka = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: clientSometimesLate.id,
      name: "Q3 Media Production",
      totalValue: 650000,
      paymentTermsDays: 14,
      status: ProjectStatus.ACTIVE,
    },
  });

  const inv2a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-004",
      title: "Product Photography — Deposit",
      userId: user.id,
      clientId: clientSometimesLate.id,
      projectId: projectEmeka.id,
      invoiceType: InvoiceType.DEPOSIT,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 90),
      dueDate: subtractDays(now, 85),
      currency: "NGN",
      subtotal: 200000,
      tax: 0,
      total: 200000,
      sentAt: subtractDays(now, 90),
      paidAt: subtractDays(now, 83),
      paystackRef: "OYAPAY-INV-SEED-004-SEED",
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
      paidAt: subtractDays(now, 83),
    },
  });

  const inv2b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-005",
      title: "Video Editing — Q3 Reel",
      userId: user.id,
      clientId: clientSometimesLate.id,
      projectId: projectEmeka.id,
      invoiceType: InvoiceType.MILESTONE,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 70),
      dueDate: subtractDays(now, 56),
      currency: "NGN",
      subtotal: 150000,
      tax: 0,
      total: 150000,
      sentAt: subtractDays(now, 70),
      paidAt: subtractDays(now, 54),
      paystackRef: "OYAPAY-INV-SEED-005-SEED",
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
      paidAt: subtractDays(now, 54),
    },
  });

  const inv2c = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-006",
      title: "Annual Report Design — Final",
      userId: user.id,
      clientId: clientSometimesLate.id,
      projectId: projectEmeka.id,
      invoiceType: InvoiceType.FINAL,
      status: InvoiceStatus.PARTIAL,
      issueDate: subtractDays(now, 20),
      dueDate: subtractDays(now, 6),
      currency: "NGN",
      subtotal: 300000,
      tax: 0,
      total: 300000,
      sentAt: subtractDays(now, 20),
      paystackRef: "OYAPAY-INV-SEED-006-SEED",
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
      paidAt: subtractDays(now, 7),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.INVOICE_SENT,
      message: "Invoice INV-SEED-006 from Adeyemi Creative Studio",
      status: "SENT",
      sentAt: subtractDays(now, 20),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv2c.id,
      channel: FollowUpChannel.WHATSAPP,
      template: FollowUpTemplate.PRE_DUE_REMINDER,
      message: `Hi Emeka, a reminder that invoice INV-SEED-006 for NGN 300,000 is due on ${subtractDays(now, 6).toLocaleDateString("en-NG")}.`,
      status: "SENT",
      sentAt: subtractDays(now, 9),
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

  const clientLate = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Biodun Fasanya",
      email: "biodun@fasanyagroup.com",
      phone: "08045678901",
      address: "22 Kofo Abayomi Street, Victoria Island, Lagos",
    },
  });

  const projectBiodun = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: clientLate.id,
      name: "Corporate Media Coverage",
      totalValue: 680000,
      paymentTermsDays: 14,
      status: ProjectStatus.ACTIVE,
    },
  });

  const inv3a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-007",
      title: "Corporate Event Coverage — Deposit",
      userId: user.id,
      clientId: clientLate.id,
      projectId: projectBiodun.id,
      invoiceType: InvoiceType.DEPOSIT,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 120),
      dueDate: subtractDays(now, 115),
      currency: "NGN",
      subtotal: 500000,
      tax: 0,
      total: 500000,
      sentAt: subtractDays(now, 120),
      paidAt: subtractDays(now, 108),
      paystackRef: "OYAPAY-INV-SEED-007-SEED",
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
      paidAt: subtractDays(now, 108),
    },
  });

  const inv3b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-008",
      title: "Office Interior Photography — Milestone",
      userId: user.id,
      clientId: clientLate.id,
      projectId: projectBiodun.id,
      invoiceType: InvoiceType.MILESTONE,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 80),
      dueDate: subtractDays(now, 66),
      currency: "NGN",
      subtotal: 180000,
      tax: 0,
      total: 180000,
      sentAt: subtractDays(now, 80),
      paidAt: subtractDays(now, 44),
      paystackRef: "OYAPAY-INV-SEED-008-SEED",
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
      paidAt: subtractDays(now, 44),
    },
  });

  const inv3c = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-009",
      title: "Executive Headshots",
      userId: user.id,
      clientId: clientLate.id,
      invoiceType: InvoiceType.STANDARD,
      status: InvoiceStatus.OVERDUE,
      issueDate: subtractDays(now, 44),
      dueDate: subtractDays(now, 30),
      currency: "NGN",
      subtotal: 250000,
      tax: 0,
      total: 250000,
      sentAt: subtractDays(now, 44),
      paystackRef: "OYAPAY-INV-SEED-009-SEED",
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
      template: FollowUpTemplate.INVOICE_SENT,
      message: "Invoice INV-SEED-009 from Adeyemi Creative Studio",
      status: "SENT",
      sentAt: subtractDays(now, 44),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.WHATSAPP,
      template: FollowUpTemplate.PRE_DUE_REMINDER,
      message: `Hi Biodun, a reminder that invoice INV-SEED-009 for NGN 250,000 is due on ${subtractDays(now, 30).toLocaleDateString("en-NG")}.`,
      status: "SENT",
      sentAt: subtractDays(now, 33),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv3c.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.FIRST_OVERDUE,
      message: "Invoice INV-SEED-009 is now overdue",
      status: "SENT",
      sentAt: subtractDays(now, 29),
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

  const clientGhost = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Chukwuemeka Eze",
      email: "c.eze@ezeconsults.ng",
      address: "Block C, Festac Town, Lagos",
    },
  });

  const projectEze = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: clientGhost.id,
      name: "Brand Consultation",
      totalValue: 450000,
      paymentTermsDays: 14,
      status: ProjectStatus.ACTIVE,
    },
  });

  const inv4a = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-010",
      title: "Brand Consultation — Deposit",
      userId: user.id,
      clientId: clientGhost.id,
      projectId: projectEze.id,
      invoiceType: InvoiceType.DEPOSIT,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 150),
      dueDate: subtractDays(now, 145),
      currency: "NGN",
      subtotal: 100000,
      tax: 0,
      total: 100000,
      sentAt: subtractDays(now, 150),
      paidAt: subtractDays(now, 143),
      paystackRef: "OYAPAY-INV-SEED-010-SEED",
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
      paidAt: subtractDays(now, 143),
    },
  });

  const inv4b = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-011",
      title: "Brand Consultation — Phase 2 Milestone",
      userId: user.id,
      clientId: clientGhost.id,
      projectId: projectEze.id,
      invoiceType: InvoiceType.MILESTONE,
      status: InvoiceStatus.OVERDUE,
      issueDate: subtractDays(now, 65),
      dueDate: subtractDays(now, 51),
      currency: "NGN",
      subtotal: 150000,
      tax: 0,
      total: 150000,
      sentAt: subtractDays(now, 65),
      notes: "As agreed, payment due 14 days from invoice date.",
      paystackRef: "OYAPAY-INV-SEED-011-SEED",
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
      template: FollowUpTemplate.INVOICE_SENT,
      message: "Invoice INV-SEED-011 from Adeyemi Creative Studio",
      status: "SENT",
      sentAt: subtractDays(now, 65),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: inv4b.id,
      channel: FollowUpChannel.EMAIL,
      template: FollowUpTemplate.FINAL_NOTICE,
      message: "Final notice: Invoice INV-SEED-011",
      status: "SENT",
      sentAt: subtractDays(now, 37),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-012",
      title: "Brand Guidelines Document — Final",
      userId: user.id,
      clientId: clientGhost.id,
      projectId: projectEze.id,
      invoiceType: InvoiceType.FINAL,
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
      invoiceType: InvoiceType.STANDARD,
      status: InvoiceStatus.PENDING,
      issueDate: subtractDays(now, 3),
      dueDate: addDays(now, 11),
      currency: "NGN",
      subtotal: 220000,
      tax: 0,
      total: 220000,
      sentAt: subtractDays(now, 3),
      paystackRef: "OYAPAY-INV-SEED-013-SEED",
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
      invoiceType: InvoiceType.STANDARD,
      status: InvoiceStatus.PAID,
      issueDate: subtractDays(now, 55),
      dueDate: subtractDays(now, 41),
      currency: "NGN",
      subtotal: 800000,
      tax: 0,
      total: 800000,
      sentAt: subtractDays(now, 55),
      paidAt: subtractDays(now, 40),
      paystackRef: "OYAPAY-INV-SEED-014-SEED",
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
      paidAt: subtractDays(now, 40),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-015",
      title: "Podcast Studio Rental",
      userId: user.id,
      clientId: clientMixed.id,
      invoiceType: InvoiceType.STANDARD,
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

  console.log(`Seeded user: ${user.email}`);
  console.log(`Seeded client: ${clientOnTime.name}`);
  console.log(`Seeded client: ${clientSometimesLate.name}`);
  console.log(`Seeded client: ${clientLate.name}`);
  console.log(`Seeded client: ${clientGhost.name}`);
  console.log(`Seeded client: ${clientNew.name}`);
  console.log(`Seeded client: ${clientMixed.name}`);
  console.log(`Seeded project: ${projectAmaka.name}`);
  console.log(`Seeded project: ${projectEmeka.name}`);
  console.log(`Seeded project: ${projectBiodun.name}`);
  console.log(`Seeded project: ${projectEze.name}`);

  console.log("\n─────────────────────────────────────────────");
  console.log("Seed complete.");
  console.log("\nLogin credentials:");
  console.log("  Email:    tunde@oyapay.test");
  console.log("  Password: password123");
  console.log("\nProjects seeded:");
  console.log("  Brand & Web Design Package  — Amaka Obi       (COMPLETED)");
  console.log(
    "  Q3 Media Production         — Emeka Nwosu     (ACTIVE, partial final invoice)",
  );
  console.log(
    "  Corporate Media Coverage    — Biodun Fasanya  (ACTIVE, standalone overdue invoice)",
  );
  console.log(
    "  Brand Consultation          — Chukwuemeka Eze (ACTIVE, overdue milestone, draft final)",
  );
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      await pool.end();
    }
  });
