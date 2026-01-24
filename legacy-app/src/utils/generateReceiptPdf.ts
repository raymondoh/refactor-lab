import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Order } from "@/types/order";

export async function generateReceiptPdf(order: Order) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 700]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  const drawText = (text: string, offsetY: number, size = 12) => {
    page.drawText(text, {
      x: 50,
      y: y - offsetY,
      size,
      font,
      color: rgb(0, 0, 0)
    });
  };

  drawText("MotoStix Order Receipt", 0, 18);
  drawText(`Order ID: ${order.id}`, 30);
  drawText(`Customer: ${order.customerName} (${order.customerEmail})`, 50);
  drawText(`Status: ${order.status}`, 70);
  drawText(`Date: ${order.createdAt?.toLocaleString() || "-"}`, 90);

  let itemOffset = 120;
  drawText("Items:", itemOffset);

  order.items.forEach((item, index) => {
    itemOffset += 20;
    drawText(`${item.quantity} × ${item.name} @ £${item.price.toFixed(2)}`, itemOffset);
  });

  const tax = order.amount * 0.08;
  const shipping = order.amount > 50 ? 0 : 5;
  const total = order.amount + tax + shipping;

  drawText(`Subtotal: £${order.amount.toFixed(2)}`, itemOffset + 40);
  drawText(`Tax: £${tax.toFixed(2)}`, itemOffset + 60);
  drawText(`Shipping: £${shipping.toFixed(2)}`, itemOffset + 80);
  drawText(`Total Paid: £${total.toFixed(2)}`, itemOffset + 100);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Receipt-${order.id.slice(0, 8).toUpperCase()}.pdf`;
  link.click();
}
