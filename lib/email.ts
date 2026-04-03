// Email notification utilities
// In production, replace sendEmail with a real email provider
// (e.g. Resend, SendGrid, Nodemailer + SMTP).
// Set EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your .env

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Sending email (dev — not delivered):", opts.subject, "→", opts.to);
    return;
  }
  // TODO: Integrate a real email provider here.
  // Example using Resend (npm install resend):
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from: process.env.EMAIL_FROM!, to: opts.to, subject: opts.subject, html: opts.html });
  console.warn("[email] No email provider configured. Email not sent:", opts.subject);
}

export function orderConfirmationEmail(order: {
  order_number: string;
  customer_name: string | null;
  total_cents: number;
  items: { product_name: string; quantity: number; unit_price_cents: number }[];
  to: string;
}): EmailOptions {
  const itemsHtml = order.items
    .map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${(i.unit_price_cents / 100).toFixed(2)}</td></tr>`)
    .join('');
  return {
    to: order.to,
    subject: `Order Confirmation — ${order.order_number}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Hi ${order.customer_name ?? 'there'},</p>
      <p>Your order <strong>${order.order_number}</strong> has been confirmed.</p>
      <table border="1" cellpadding="6">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Total: $${(order.total_cents / 100).toFixed(2)}</strong></p>
    `,
  };
}

export function shippingUpdateEmail(opts: {
  customer_name: string | null;
  order_number: string;
  carrier?: string;
  tracking_number?: string;
  status: string;
  to: string;
}): EmailOptions {
  return {
    to: opts.to,
    subject: `Shipping Update — ${opts.order_number}`,
    html: `
      <h1>Shipping Update</h1>
      <p>Hi ${opts.customer_name ?? 'there'},</p>
      <p>Your order <strong>${opts.order_number}</strong> status: <strong>${opts.status}</strong>.</p>
      ${opts.carrier ? `<p>Carrier: ${opts.carrier}</p>` : ''}
      ${opts.tracking_number ? `<p>Tracking: ${opts.tracking_number}</p>` : ''}
    `,
  };
}

export function passwordResetEmail(opts: { resetUrl: string; to: string }): EmailOptions {
  return {
    to: opts.to,
    subject: 'Reset your Noir Crates password',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${opts.resetUrl}">${opts.resetUrl}</a></p>
      <p>If you did not request this, ignore this email.</p>
    `,
  };
}

export function emailVerificationEmail(opts: { verifyUrl: string; to: string }): EmailOptions {
  return {
    to: opts.to,
    subject: 'Verify your Noir Crates email',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click below to verify your email address:</p>
      <p><a href="${opts.verifyUrl}">${opts.verifyUrl}</a></p>
    `,
  };
}
