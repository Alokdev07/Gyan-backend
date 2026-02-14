import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, code) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GyanAryan" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code or complaint",
      html: `
        <div>
          <h2>Verification Code or complaint</h2>
          <h1>${code}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};
