// backend/utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify().then(() => {
  console.log('✅ Mail transporter verified');
}).catch(err => {
  console.warn('⚠️ Mail transporter verification failed:', err.message);
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"Blood Sugar Tracker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Blood Sugar Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Blood Sugar Tracker!</h2>
        <p>Please verify your email address by entering the code below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Blood Sugar Tracker - Helping you manage your health</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};