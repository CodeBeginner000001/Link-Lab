const transporter = require("./nodemailer-config");

exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: body.to,
        subject: body.subject,
        html: body.html,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
    } catch (err) {
      console.error("Error sending email for record:", record.messageId, err);
    }
  }
  console.log("run successfully")
};