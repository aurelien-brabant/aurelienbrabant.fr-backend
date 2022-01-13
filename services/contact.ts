import contactTransporter from "../nodemailer/contact_transporter";

export const sendContactData = async (
  email: string,
  name: string,
  message: string
) => {
    await contactTransporter.sendMail({
      from: {
        name: 'Aurélien Brabant Contact',
        address: process.env.CONTACT_EMAIL_USER
      },
      to: process.env.CONTACT_EMAIL_USER,
      subject: `${name}/${email} - Contact`,
      text: message,
    });
    console.log("Message sent");
};
