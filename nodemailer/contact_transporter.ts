import { createTransport } from 'nodemailer';

export default createTransport({
	host: 'ssl0.ovh.net',
	port: 465,
	secure: true,
	auth: {
		user: process.env.CONTACT_EMAIL_USER,
		pass: process.env.CONTACT_EMAIL_PASSWORD
	}
});
