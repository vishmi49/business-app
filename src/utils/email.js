const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const getAdminEmails = () => {
  return process.env.ADMIN_EMAILS.split(',').map((email) => email.trim());
};

const sendInquiryNotification = async (inquiry) => {
  const adminEmails = getAdminEmails();

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: adminEmails,
    subject: `New Inquiry from ${inquiry.name} - ${inquiry.companyName || 'Individual'}`,
    html: `
      <h2>New Customer Inquiry</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Name</td>
          <td style="padding: 8px;">${inquiry.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Company</td>
          <td style="padding: 8px;">${inquiry.companyName || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email</td>
          <td style="padding: 8px;">${inquiry.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Contact Number</td>
          <td style="padding: 8px;">${inquiry.contactNumber}</td>
        </tr>
      </table>
      <h3>Order Description</h3>
      <div>${inquiry.description || 'No description provided'}</div>
    `,
  });
};

module.exports = { sendInquiryNotification };
