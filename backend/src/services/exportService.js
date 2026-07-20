const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Streams an Excel report of orders directly to the HTTP response.
async function exportOrdersToExcel(orders, res, filename = "orders.xlsx") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orders");

  sheet.columns = [
    { header: "Order Number", key: "orderNumber", width: 22 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer Name", key: "customerName", width: 22 },
    { header: "Customer Email", key: "customerEmail", width: 26 },
    { header: "Items", key: "items", width: 40 },
    { header: "Category(ies)", key: "categories", width: 20 },
    { header: "Subtotal", key: "subtotal", width: 12 },
    { header: "GST", key: "gst", width: 12 },
    { header: "Shipping", key: "shipping", width: 12 },
    { header: "Total (₹)", key: "total", width: 14 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Order Status", key: "orderStatus", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  orders.forEach((order) => {
    sheet.addRow({
      orderNumber: order.orderNumber,
      date: new Date(order.placedAt).toLocaleDateString("en-IN"),
      customerName: order.user?.name || order.shippingAddress?.name || "-",
      customerEmail: order.user?.email || "-",
      items: order.items.map((i) => `${i.title} x${i.quantity}`).join(", "),
      categories: [...new Set(order.items.map((i) => i.category))].join(", "),
      subtotal: order.subtotal,
      gst: order.gstTotal || 0,
      shipping: order.shippingFee,
      total: order.totalAmount,
      paymentStatus: order.paymentInfo?.status,
      orderStatus: order.orderStatus,
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  await workbook.xlsx.write(res);
  res.end();
}

// Streams a full-detail PDF report of orders directly to the HTTP response.
// Each order gets its own block with everything an admin needs without having
// to open the order individually: order ID, date+time, customer, delivery
// address, line items, and the payment/status/total breakdown.
function exportOrdersToPdf(orders, res, filename = "orders.pdf") {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  doc.pipe(res);

  doc.fontSize(16).text("Tanvi Luxury Store — Orders Report", { align: "center" });
  doc.fontSize(9).fillColor("#666").text(`Generated ${new Date().toLocaleString("en-IN")} · ${orders.length} order(s)`, {
    align: "center",
  });
  doc.fillColor("#000");
  doc.moveDown(1);

  orders.forEach((order, idx) => {
    const addr = order.shippingAddress || {};
    const placedAt = order.placedAt ? new Date(order.placedAt) : null;

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`${idx + 1}. Order ${order.orderNumber}`, { continued: true })
      .fontSize(9)
      .fillColor("#666")
      .text(
        `   Placed: ${
          placedAt ? placedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"
        }`
      );

    doc
      .fontSize(9)
      .fillColor("#000")
      .text(`Customer: ${order.user?.name || addr.name || "-"} (${order.user?.email || "-"})`)
      .text(
        `Delivery address: ${addr.name || "-"}, ${addr.line1 || ""}${
          addr.line2 ? ", " + addr.line2 : ""
        }, ${addr.city || "-"}, ${addr.state || "-"} - ${addr.pincode || "-"} · Phone: ${
          addr.phone || "-"
        }`
      )
      .text(
        `Order status: ${order.orderStatus || "-"}   |   Payment: ${
          order.paymentInfo?.status || "-"
        } (${order.paymentInfo?.method === "cod" ? "COD" : "Online"})`
      );

    doc.moveDown(0.3);
    doc.fontSize(9).text("Items:", { underline: true });
    order.items.forEach((item) => {
      doc.text(`  • ${item.title}  x${item.quantity}  —  ₹${(item.price * item.quantity).toLocaleString("en-IN")}`);
    });

    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .text(
        `Subtotal: ₹${order.subtotal?.toLocaleString("en-IN")}   |   GST: ₹${(
          order.gstTotal || 0
        ).toLocaleString("en-IN")}   |   Shipping: ₹${order.shippingFee?.toLocaleString(
          "en-IN"
        )}   |   `,
        { continued: true }
      )
      .fontSize(10)
      .text(`Total: ₹${order.totalAmount?.toLocaleString("en-IN")}`);

    doc.moveDown(0.4);
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#ddd")
      .stroke();
    doc.moveDown(0.6);
  });

  doc.end();
}

// Single order invoice PDF
function generateInvoicePdf(order, res) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text("Tanvi Luxury Store", { align: "left" });
  doc.fontSize(10).text("Tax Invoice", { align: "left" });
  doc.moveDown();

  doc.fontSize(11).text(`Order Number: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString("en-IN")}`);
  doc.text(`Payment Status: ${order.paymentInfo?.status}`);
  doc.moveDown();

  doc.text("Shipping To:");
  const addr = order.shippingAddress;
  doc.text(`${addr.name}, ${addr.line1} ${addr.line2 || ""}`);
  doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`);
  doc.text(`Phone: ${addr.phone}`);
  doc.moveDown();

  doc.text("Items:", { underline: true });
  order.items.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    const gstNote = item.gstPercent ? `  (GST ${item.gstPercent}%: ₹${item.gstAmount || 0})` : "";
    doc.text(`${item.title}  x${item.quantity}  —  ₹${lineTotal}${gstNote}`);
  });
  doc.moveDown();

  doc.text(`Subtotal: ₹${order.subtotal}`);
  doc.text(`GST: ₹${order.gstTotal || 0}`);
  doc.text(`Shipping: ₹${order.shippingFee}`);
  doc.fontSize(13).text(`Total: ₹${order.totalAmount}`, { underline: true });

  doc.end();
}

module.exports = { exportOrdersToExcel, exportOrdersToPdf, generateInvoicePdf };
