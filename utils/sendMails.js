

const nodemailer = require('nodemailer');

const sendMail = (OTP, email, emailTemplate, subject) => {
    // Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port:587,
    auth: {
      user: process.env.USEREMAIL, // Replace with your Gmail email address
      pass: process.env.PASSWORD // Replace with your Gmail password or an application-specific password
    }
  });
  
  // Email content
  const mailOptions = {
    from: 'verify@podcasttonight.com', // Replace with your Gmail email address
    to: email, // Replace with the recipient's email address
    subject: subject,
    // text: 'This is a test email sent from Node.js using nodemailer.',
    html: emailTemplate(OTP)
  };
  
  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

module.exports = sendMail