import SibApiV3Sdk from "@getbrevo/brevo";
import dotenv from 'dotenv'

dotenv.config()

export const sendOtpEmail = async (email, code) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );


    const sendSmtpEmail = {
      sender: { email: "csekhar2028@gmail.com", name: "GyanAryan" },
      to: [{ email }],
      subject: "Your Verification Code",
      htmlContent: `
        <div>
          <h2>Verification Code</h2>
          <h1>${code}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};