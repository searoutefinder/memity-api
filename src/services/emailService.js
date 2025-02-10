require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendVerificationEmail = async (email, token) => {

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Click <a href="${process.env.APP_URL}:${process.env.APP_PORT}/auth/verify-email/${token}">here</a> to verify your email.</p>`
  }

  await transporter.sendMail(mailOptions)
}

const sendPasswordResetEmail = async (email, token) => {
  
  const resetLink = `${process.env.APP_URL}:${process.env.APP_PORT}/auth/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  };
  
  await transporter.sendMail(mailOptions);
}
  

module.exports = {
  sendVerificationEmail: sendVerificationEmail,
  sendPasswordResetEmail: sendPasswordResetEmail
}
