// utils/sendEmail.js
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port) || 587,
  secure: Number(process.env.EMAIL_SECURE_PORT || 0) === 465, // true for 465
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  // For development, you can add `tls: { rejectUnauthorized: false }` if using self-signed
});

/**
 * sendEmail({ to, subject, text, html })
 * Returns info object or throws error.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const msg = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };

  // Basic retry for transient errors
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const info = await transporter.sendMail(msg);
      return info;
    } catch (err) {
      if (attempt === 2) throw err;
      // small delay before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
};

export default sendEmail;
