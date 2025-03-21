require('dotenv').config();
const nodemailer = require('nodemailer');
const templates = require('../templates/emailTemplates')

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

  const verificationLink = `${process.env.API_URL}/auth/verify-email/${token}`
  const verifyEmailText = templates.verifyRegistrationTemplate.replaceAll("{{action_url}}", verificationLink)

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Memity - Verify Your Email',
    html: verifyEmailText
  }

  await transporter.sendMail(mailOptions)
}

const sendPasswordResetEmail = async (email, token) => {
  
  const resetLink = `${process.env.CLIENT_APP_URL}/auth?mode=reset-password&token=${token}`;
  const resetEmailText = templates.resetPasswordTemplate
    .replaceAll("{{action_url}}", resetLink)
    .replaceAll("{{name}}", email)
    .replaceAll("{{support_url}}", `mailto:${process.env.SUPPORT_EMAIL}`)

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Memity - Reset Your Password',
    html: resetEmailText
  };
  
  await transporter.sendMail(mailOptions);
}
  

module.exports = {
  sendVerificationEmail: sendVerificationEmail,
  sendPasswordResetEmail: sendPasswordResetEmail
}
