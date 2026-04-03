import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const order = db.prepare(
    "SELECT * FROM orders WHERE id = ? AND customer_id = ?"
  ).get(id, customer.id) as Record<string, unknown> | undefined;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?")
    .all(id) as { product_name: string; quantity: number; unit_price_cents: number }[];

  const itemsRows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${(i.unit_price_cents / 100).toFixed(2)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${order.order_number}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 24px; font-weight: bold; color: #2A1520; }
    .invoice-title { font-size: 14px; color: #888; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #f8f8f8; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
    th:last-child { text-align: right; }
    .totals { margin-top: 24px; text-align: right; }
    .total-row { margin: 4px 0; font-size: 14px; }
    .total-final { font-size: 18px; font-weight: bold; margin-top: 8px; }
    footer { margin-top: 60px; font-size: 12px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Noir Crates</div>
      <div class="invoice-title">INVOICE</div>
    </div>
    <div style="text-align:right">
      <div><strong>Order #${order.order_number}</strong></div>
      <div style="color:#888;font-size:13px">${new Date(order.created_at as string).toLocaleDateString()}</div>
      <div style="margin-top:8px;font-size:13px">Status: <strong>${order.status}</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Price</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <div class="total-row">Subtotal: $${((order.subtotal_cents as number) / 100).toFixed(2)}</div>
    ${(order.shipping_cents as number) > 0 ? `<div class="total-row">Shipping: $${((order.shipping_cents as number) / 100).toFixed(2)}</div>` : ''}
    ${(order.tax_cents as number) > 0 ? `<div class="total-row">Tax: $${((order.tax_cents as number) / 100).toFixed(2)}</div>` : ''}
    ${(order.discount_cents as number) > 0 ? `<div class="total-row">Discount: -$${((order.discount_cents as number) / 100).toFixed(2)}</div>` : ''}
    <div class="total-final">Total: $${((order.total_cents as number) / 100).toFixed(2)} ${String(order.currency).toUpperCase()}</div>
  </div>

  <footer>Thank you for shopping with Noir Crates.</footer>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${order.order_number}.html"`,
    },
  });
}
