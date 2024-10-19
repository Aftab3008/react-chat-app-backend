import nodemailer from "nodemailer";

export const sendVerificationEmail = (userEmail, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const message = {
    from: process.env.MAIL_ADDRESS,
    to: userEmail,
    subject: "Email Verification",
    html: `<p>Please verify your email by clicking the following link:</p>
               <a href="${verificationLink}">${verificationLink}</a>`,
  };

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};
