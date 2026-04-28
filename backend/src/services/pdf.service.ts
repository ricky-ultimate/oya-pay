import PDFDocument from "pdfkit";
import { Invoice, InvoiceItem, Client, User } from "../generated/prisma/client";

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  client: Client;
  user: User;
};

export const generateInvoicePDF = (
  invoice: InvoiceWithRelations,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", { align: "right" });
    doc.fontSize(10).font("Helvetica");
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, { align: "right" });
    doc.text(
      `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString("en-NG")}`,
      { align: "right" },
    );
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-NG")}`,
      { align: "right" },
    );

    doc.moveDown(2);

    doc.font("Helvetica-Bold").text("From:");
    doc.font("Helvetica").text(invoice.user.name);
    if (invoice.user.businessName) doc.text(invoice.user.businessName);
    doc.text(invoice.user.email);
    if (invoice.user.phone) doc.text(invoice.user.phone);

    doc.moveDown();

    doc.font("Helvetica-Bold").text("Bill To:");
    doc.font("Helvetica").text(invoice.client.name);
    doc.text(invoice.client.email);
    if (invoice.client.phone) doc.text(invoice.client.phone);
    if (invoice.client.address) doc.text(invoice.client.address);

    doc.moveDown(2);

    const tableTop = doc.y;
    const col = { desc: 50, qty: 290, unit: 360, total: 460 };

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Description", col.desc, tableTop);
    doc.text("Qty", col.qty, tableTop);
    doc.text("Unit Price", col.unit, tableTop);
    doc.text("Total", col.total, tableTop);

    const lineY = tableTop + 16;
    doc.moveTo(50, lineY).lineTo(545, lineY).stroke();

    doc.font("Helvetica");
    let rowY = lineY + 8;

    for (const item of invoice.items) {
      doc.text(item.description, col.desc, rowY, { width: 230 });
      doc.text(String(Number(item.quantity)), col.qty, rowY);
      doc.text(
        `${invoice.currency} ${Number(item.unitPrice).toLocaleString("en-NG")}`,
        col.unit,
        rowY,
      );
      doc.text(
        `${invoice.currency} ${Number(item.total).toLocaleString("en-NG")}`,
        col.total,
        rowY,
      );
      rowY += 22;
    }

    doc.moveTo(50, rowY).lineTo(545, rowY).stroke();
    rowY += 10;

    doc.text("Subtotal:", 360, rowY);
    doc.text(
      `${invoice.currency} ${Number(invoice.subtotal).toLocaleString("en-NG")}`,
      col.total,
      rowY,
    );
    rowY += 18;

    if (Number(invoice.tax) > 0) {
      doc.text("Tax:", 360, rowY);
      doc.text(
        `${invoice.currency} ${Number(invoice.tax).toLocaleString("en-NG")}`,
        col.total,
        rowY,
      );
      rowY += 18;
    }

    doc.font("Helvetica-Bold");
    doc.text("Total:", 360, rowY);
    doc.text(
      `${invoice.currency} ${Number(invoice.total).toLocaleString("en-NG")}`,
      col.total,
      rowY,
    );

    if (invoice.notes) {
      doc.moveDown(2).font("Helvetica");
      doc.font("Helvetica-Bold").text("Notes:");
      doc.font("Helvetica").text(invoice.notes);
    }

    if (invoice.paystackRef) {
      const payLink = `https://paystack.com/pay/${invoice.paystackRef}`;
      doc.moveDown().font("Helvetica-Bold").text("Pay Online:");
      doc.font("Helvetica").text(payLink, { link: payLink, underline: true });
    }

    doc.end();
  });
};
