const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});

class EmailService {
    static async sendMail({ to, subject, html }) {
        return await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: "ChatApp",
                email: process.env.EMAIL,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        });
    }
}

module.exports = EmailService;