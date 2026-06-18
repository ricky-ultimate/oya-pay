import PDFDocument from "pdfkit";
import { Invoice, InvoiceItem, Client, User } from "../generated/prisma/client";

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  client: Client;
  user: User & {
    bankName?: string | null;
    bankAccount?: string | null;
    bankAccountName?: string | null;
    invoiceTerms?: string | null;
  };
};

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const COL_DESC = PAGE_MARGIN;
const COL_QTY = PAGE_MARGIN + CONTENT_WIDTH * 0.55;
const COL_UNIT = PAGE_MARGIN + CONTENT_WIDTH * 0.7;
const COL_TOTAL = PAGE_MARGIN + CONTENT_WIDTH * 0.85;

const COLOR_INK = "#111827";
const COLOR_MUTED = "#6B7280";
const COLOR_RULE = "#E5E7EB";
const COLOR_ACCENT = "#0EA5E9";
const COLOR_HEADER_BG = "#0F172A";
const COLOR_HEADER_TEXT = "#FFFFFF";
const COLOR_ROW_ALT = "#F9FAFB";

function drawHRule(
  doc: PDFKit.PDFDocument,
  y: number,
  color = COLOR_RULE,
  thickness = 0.5,
): void {
  doc
    .save()
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
    .lineWidth(thickness)
    .strokeColor(color)
    .stroke()
    .restore();
}

function sectionLabel(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
): void {
  doc
    .save()
    .fontSize(7)
    .font("Helvetica-Bold")
    .fillColor(COLOR_MUTED)
    .text(text.toUpperCase(), x, y, { characterSpacing: 0.8 })
    .restore();
}

export const generateInvoicePDF = (
  invoice: InvoiceWithRelations,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: invoice.user.businessName ?? invoice.user.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const senderName = invoice.user.businessName ?? invoice.user.name;
    const hasBankDetails =
      invoice.user.bankName &&
      invoice.user.bankAccount &&
      invoice.user.bankAccountName;
    const hasPayLink = !!invoice.paystackRef;
    const defaultTerms =
      "Payment is due within 14 days of the invoice date. Late payment may incur additional charges. Thank you for your business.";
    const terms = invoice.user.invoiceTerms?.trim() || defaultTerms;

    // Header band
    const HEADER_HEIGHT = 88;
    doc
      .save()
      .rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT)
      .fill(COLOR_HEADER_BG)
      .restore();

    // Business name in header
    doc
      .save()
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(COLOR_HEADER_TEXT)
      .text(senderName, PAGE_MARGIN, 28, { lineBreak: false })
      .restore();

    if (invoice.user.email) {
      doc
        .save()
        .fontSize(8)
        .font("Helvetica")
        .fillColor("rgba(255,255,255,0.55)")
        .text(invoice.user.email, PAGE_MARGIN, 52, { lineBreak: false })
        .restore();
    }

    if (invoice.user.phone) {
      const emailWidth = invoice.user.email
        ? doc.widthOfString(invoice.user.email, { fontSize: 8 }) + 12
        : 0;
      doc
        .save()
        .fontSize(8)
        .font("Helvetica")
        .fillColor("rgba(255,255,255,0.55)")
        .text(
          invoice.user.phone,
          PAGE_MARGIN + (invoice.user.email ? emailWidth : 0),
          52,
          { lineBreak: false },
        )
        .restore();
    }

    // "INVOICE" label right-aligned in header
    doc
      .save()
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(COLOR_ACCENT)
      .text("INVOICE", 0, 22, {
        align: "right",
        width: PAGE_WIDTH - PAGE_MARGIN,
      })
      .restore();

    // Invoice meta right column
    const metaY = 54;
    doc
      .save()
      .fontSize(8)
      .font("Helvetica")
      .fillColor("rgba(255,255,255,0.7)")
      .text(invoice.invoiceNumber, 0, metaY, {
        align: "right",
        width: PAGE_WIDTH - PAGE_MARGIN,
        lineBreak: false,
      })
      .restore();

    // Party section
    const PARTY_Y = HEADER_HEIGHT + 24;

    // Bill To block
    sectionLabel(doc, "Bill To", PAGE_MARGIN, PARTY_Y);
    let billToY = PARTY_Y + 14;
    doc
      .save()
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLOR_INK)
      .text(invoice.client.name, PAGE_MARGIN, billToY)
      .restore();
    billToY += 16;

    doc
      .save()
      .fontSize(9)
      .font("Helvetica")
      .fillColor(COLOR_MUTED)
      .text(invoice.client.email, PAGE_MARGIN, billToY)
      .restore();
    billToY += 13;

    if (invoice.client.phone) {
      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_MUTED)
        .text(invoice.client.phone, PAGE_MARGIN, billToY)
        .restore();
      billToY += 13;
    }

    if (invoice.client.address) {
      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_MUTED)
        .text(invoice.client.address, PAGE_MARGIN, billToY, {
          width: CONTENT_WIDTH * 0.45,
        })
        .restore();
    }

    // Date block right column
    const DATE_COL_X = PAGE_MARGIN + CONTENT_WIDTH * 0.6;
    const DATE_COL_WIDTH = CONTENT_WIDTH * 0.4;

    sectionLabel(doc, "Invoice Details", DATE_COL_X, PARTY_Y);
    let dateRowY = PARTY_Y + 14;

    const dateRows: [string, string][] = [
      ["Invoice No.", invoice.invoiceNumber],
      [
        "Issue Date",
        new Date(invoice.issueDate).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ],
      [
        "Due Date",
        new Date(invoice.dueDate).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ],
    ];

    for (const [label, value] of dateRows) {
      doc
        .save()
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(COLOR_MUTED)
        .text(label, DATE_COL_X, dateRowY, {
          width: DATE_COL_WIDTH * 0.45,
          lineBreak: false,
        })
        .restore();

      doc
        .save()
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(COLOR_INK)
        .text(value, DATE_COL_X + DATE_COL_WIDTH * 0.45, dateRowY, {
          width: DATE_COL_WIDTH * 0.55,
          lineBreak: false,
        })
        .restore();

      dateRowY += 16;
    }

    // Table header
    const TABLE_Y = Math.max(billToY, dateRowY) + 28;

    drawHRule(doc, TABLE_Y - 6);

    doc
      .save()
      .rect(PAGE_MARGIN, TABLE_Y, CONTENT_WIDTH, 24)
      .fill("#F3F4F6")
      .restore();

    const TABLE_HEADER_Y = TABLE_Y + 7;
    doc
      .save()
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(COLOR_MUTED)
      .text("DESCRIPTION", COL_DESC + 6, TABLE_HEADER_Y, {
        characterSpacing: 0.5,
      })
      .text("QTY", COL_QTY, TABLE_HEADER_Y, {
        width: COL_UNIT - COL_QTY,
        align: "right",
        characterSpacing: 0.5,
      })
      .text("UNIT PRICE", COL_UNIT, TABLE_HEADER_Y, {
        width: COL_TOTAL - COL_UNIT,
        align: "right",
        characterSpacing: 0.5,
      })
      .text("TOTAL", COL_TOTAL, TABLE_HEADER_Y, {
        width: PAGE_WIDTH - PAGE_MARGIN - COL_TOTAL,
        align: "right",
        characterSpacing: 0.5,
      })
      .restore();

    // Table rows
    let rowY = TABLE_Y + 24;
    const ROW_HEIGHT = 28;

    invoice.items.forEach((item: InvoiceItem, index: number) => {
      if (index % 2 === 1) {
        doc
          .save()
          .rect(PAGE_MARGIN, rowY, CONTENT_WIDTH, ROW_HEIGHT)
          .fill(COLOR_ROW_ALT)
          .restore();
      }

      const cellY = rowY + 8;

      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_INK)
        .text(item.description, COL_DESC + 6, cellY, {
          width: COL_QTY - COL_DESC - 12,
          lineBreak: false,
          ellipsis: true,
        })
        .restore();

      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_INK)
        .text(String(Number(item.quantity)), COL_QTY, cellY, {
          width: COL_UNIT - COL_QTY - 4,
          align: "right",
          lineBreak: false,
        })
        .restore();

      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_INK)
        .text(
          `${invoice.currency} ${Number(item.unitPrice).toLocaleString("en-NG")}`,
          COL_UNIT,
          cellY,
          {
            width: COL_TOTAL - COL_UNIT - 4,
            align: "right",
            lineBreak: false,
          },
        )
        .restore();

      doc
        .save()
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLOR_INK)
        .text(
          `${invoice.currency} ${Number(item.total).toLocaleString("en-NG")}`,
          COL_TOTAL,
          cellY,
          {
            width: PAGE_WIDTH - PAGE_MARGIN - COL_TOTAL,
            align: "right",
            lineBreak: false,
          },
        )
        .restore();

      rowY += ROW_HEIGHT;
    });

    drawHRule(doc, rowY + 2);

    // Totals block
    const TOTALS_X = PAGE_WIDTH - PAGE_MARGIN - CONTENT_WIDTH * 0.38;
    const TOTALS_VALUE_X = PAGE_WIDTH - PAGE_MARGIN - CONTENT_WIDTH * 0.18;
    const TOTALS_VALUE_WIDTH = CONTENT_WIDTH * 0.18;
    let totalsY = rowY + 14;

    const subtotal = Number(invoice.subtotal);
    const tax = Number(invoice.tax);
    const total = Number(invoice.total);

    doc
      .save()
      .fontSize(9)
      .font("Helvetica")
      .fillColor(COLOR_MUTED)
      .text("Subtotal", TOTALS_X, totalsY)
      .restore();

    doc
      .save()
      .fontSize(9)
      .font("Helvetica")
      .fillColor(COLOR_INK)
      .text(
        `${invoice.currency} ${subtotal.toLocaleString("en-NG")}`,
        TOTALS_VALUE_X,
        totalsY,
        { width: TOTALS_VALUE_WIDTH, align: "right" },
      )
      .restore();

    totalsY += 16;

    if (tax > 0) {
      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_MUTED)
        .text("Tax", TOTALS_X, totalsY)
        .restore();

      doc
        .save()
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR_INK)
        .text(
          `${invoice.currency} ${tax.toLocaleString("en-NG")}`,
          TOTALS_VALUE_X,
          totalsY,
          { width: TOTALS_VALUE_WIDTH, align: "right" },
        )
        .restore();

      totalsY += 16;
    }

    drawHRule(doc, totalsY, COLOR_RULE, 1);
    totalsY += 10;

    // Total amount band
    doc
      .save()
      .rect(
        TOTALS_X - 8,
        totalsY - 4,
        PAGE_WIDTH - PAGE_MARGIN - TOTALS_X + 8,
        28,
      )
      .fill(COLOR_HEADER_BG)
      .restore();

    doc
      .save()
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(COLOR_HEADER_TEXT)
      .text("Total Due", TOTALS_X, totalsY + 7)
      .restore();

    doc
      .save()
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(COLOR_ACCENT)
      .text(
        `${invoice.currency} ${total.toLocaleString("en-NG")}`,
        TOTALS_VALUE_X,
        totalsY + 6,
        { width: TOTALS_VALUE_WIDTH, align: "right" },
      )
      .restore();

    totalsY += 36;

    // Payment section
    const PAYMENT_Y = totalsY + 16;
    const hasPaymentInfo = hasPayLink || hasBankDetails;

    if (hasPaymentInfo) {
      drawHRule(doc, PAYMENT_Y - 8);
      sectionLabel(doc, "Payment Options", PAGE_MARGIN, PAYMENT_Y);

      let payY = PAYMENT_Y + 16;
      const COL2_X = PAGE_MARGIN + CONTENT_WIDTH * 0.5 + 12;

      if (hasPayLink) {
        const payLink = `https://checkout.paystack.com/${invoice.paystackRef}`;

        doc
          .save()
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(COLOR_INK)
          .text("Pay Online", PAGE_MARGIN, payY)
          .restore();

        payY += 13;

        doc
          .save()
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(COLOR_ACCENT)
          .text(payLink, PAGE_MARGIN, payY, {
            link: payLink,
            underline: true,
            width: CONTENT_WIDTH * 0.5 - 8,
          })
          .restore();
      }

      if (hasBankDetails) {
        const bankStartY = hasPayLink ? PAYMENT_Y + 16 : payY;

        doc
          .save()
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(COLOR_INK)
          .text("Bank Transfer", hasPayLink ? COL2_X : PAGE_MARGIN, bankStartY)
          .restore();

        const bankRows: [string, string][] = [
          ["Bank", invoice.user.bankName!],
          ["Account No.", invoice.user.bankAccount!],
          ["Account Name", invoice.user.bankAccountName!],
        ];

        let bankRowY = bankStartY + 13;
        for (const [label, value] of bankRows) {
          doc
            .save()
            .fontSize(8)
            .font("Helvetica")
            .fillColor(COLOR_MUTED)
            .text(`${label}: `, hasPayLink ? COL2_X : PAGE_MARGIN, bankRowY, {
              continued: true,
              lineBreak: false,
            })
            .font("Helvetica-Bold")
            .fillColor(COLOR_INK)
            .text(value)
            .restore();

          bankRowY += 13;
        }
      }

      totalsY = Math.max(
        payY + (hasPayLink ? 16 : 0),
        PAYMENT_Y + (hasBankDetails ? 16 + 13 * 4 : 0),
      );
    }

    // Notes section
    if (invoice.notes) {
      const NOTES_Y = totalsY + 20;
      drawHRule(doc, NOTES_Y - 8);
      sectionLabel(doc, "Notes", PAGE_MARGIN, NOTES_Y);

      doc
        .save()
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(COLOR_MUTED)
        .text(invoice.notes, PAGE_MARGIN, NOTES_Y + 14, {
          width: CONTENT_WIDTH,
          lineBreak: true,
        })
        .restore();

      totalsY =
        NOTES_Y +
        14 +
        doc.heightOfString(invoice.notes, {
          width: CONTENT_WIDTH,
          fontSize: 8.5,
        });
    }

    // Terms section
    const TERMS_Y = totalsY + 20;
    drawHRule(doc, TERMS_Y - 8);
    sectionLabel(doc, "Terms", PAGE_MARGIN, TERMS_Y);

    doc
      .save()
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLOR_MUTED)
      .text(terms, PAGE_MARGIN, TERMS_Y + 14, {
        width: CONTENT_WIDTH,
        lineBreak: true,
      })
      .restore();

    // Footer
    const FOOTER_Y = doc.page.height - 36;
    drawHRule(doc, FOOTER_Y - 6, COLOR_RULE, 0.5);

    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(COLOR_MUTED)
      .text(`${senderName} — Generated by OyaPay`, PAGE_MARGIN, FOOTER_Y, {
        align: "center",
        width: CONTENT_WIDTH,
      })
      .restore();

    doc.end();
  });
};
