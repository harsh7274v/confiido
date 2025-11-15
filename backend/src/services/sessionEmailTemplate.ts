import nodemailer from 'nodemailer';

// Create transporter lazily for serverless optimization
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    // Verify required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing: EMAIL_USER and EMAIL_PASS environment variables are required');
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('✅ Email transporter initialized for serverless');
  }
  return transporter;
};

interface SessionConfirmationData {
  userName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  mentorName: string;
  sessionTopic?: string;
  timeZone?: string;
  meetingLink?: string;
  mentorTitle?: string; // Added for better display
}

/**
 * Sends a professional session confirmation email after successful payment
 */
export const sendSessionConfirmationEmail = async (
  to: string,
  data: SessionConfirmationData
) => {
  const {
    userName,
    sessionDate,
    startTime,
    endTime,
    mentorName,
    sessionTopic = 'Your scheduled session',
    timeZone = 'IST',
    meetingLink
  } = data;

  const subject = `Your Confiido Session is Confirmed – ${sessionDate}`;

  // Plain text version
  const text = `Hello ${userName},

✓ Your session has been successfully confirmed!

Session Details:
- Mentor: ${mentorName}
- Topic: ${sessionTopic}
- Date & Time: ${sessionDate}, ${startTime} – ${endTime} ${timeZone}
${meetingLink ? `- Join link: ${meetingLink}` : '- Join link: Will be shared shortly'}

What to expect:
1. Your mentor will guide you through the process
2. Join on time to make the most of your session
3. Feel free to ask questions

Need to reschedule or have questions? Visit your Confiido dashboard.

We look forward to supporting your journey!

Best regards,
The Confiido Team

© ${new Date().getFullYear()} Confiido. All rights reserved.`;

  // HTML version matching the welcome email design (black and white theme)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-style: italic;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
    }
    .success-message {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 30px;
      font-size: 16px;
      font-weight: bold;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-top: 30px;
      margin-bottom: 20px;
      text-align: center;
    }
    .details-box {
      background-color: #f8f9fa;
      border-left: 4px solid #000000;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .detail-row {
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 16px;
      color: #333333;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #000000;
      display: inline-block;
      min-width: 120px;
    }
    .detail-value {
      color: #333333;
    }
    .cta-button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #333333;
    }
    .steps {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .step {
      background-color: #f8f9fa;
      border-left: 4px solid #000000;
      padding: 15px 20px;
      margin-bottom: 15px;
      border-radius: 5px;
    }
    .step-number {
      display: inline-block;
      background-color: #000000;
      color: #ffffff;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      font-weight: bold;
      margin-right: 15px;
    }
    .step-text {
      display: inline-block;
      vertical-align: middle;
      font-size: 16px;
      color: #333333;
    }
    .warning-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONFIIDO</h1>
    </div>
    
    <div class="content">
      <div class="success-message">
        ✓ Your session has been successfully confirmed!
      </div>
      
      <p class="greeting">Hello ${userName},</p>
      
      <p style="color: #333333; line-height: 1.6;">
        Great news! Your mentoring session has been confirmed. We're excited to help you on your journey.
      </p>
      
      <div class="section-title">Session Details</div>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Mentor:</span>
          <span class="detail-value">${mentorName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Topic:</span>
          <span class="detail-value">${sessionTopic}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${sessionDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${startTime} – ${endTime} ${timeZone}</span>
        </div>
      </div>
      
      ${meetingLink ? `
        <div style="text-align: center;">
          <a href="${meetingLink}" class="cta-button">Join Session</a>
        </div>
        <p style="text-align: center; color: #666666; font-size: 14px; margin-top: 15px;">
          Or copy this link: <a href="${meetingLink}" style="color: #000000; word-break: break-all;">${meetingLink}</a>
        </p>
      ` : `
        <div class="warning-box">
          <strong>Meeting link will be shared shortly.</strong><br>
          You'll receive it before your scheduled session.
        </div>
      `}
      
      <div class="section-title">What to Expect</div>
      
      <ul class="steps">
        <li class="step">
          <span class="step-number">1</span>
          <span class="step-text">Your mentor will guide you through the process</span>
        </li>
        <li class="step">
          <span class="step-number">2</span>
          <span class="step-text">Join on time to make the most of your session</span>
        </li>
        <li class="step">
          <span class="step-number">3</span>
          <span class="step-text">Feel free to ask questions – that's what we're here for!</span>
        </li>
      </ul>
      
      <p style="color: #333333; line-height: 1.6; margin-top: 30px;">
        Need to reschedule or have questions? Visit your <a href="${process.env.FRONTEND_URL || 'https://www.confiido.in'}/dashboard" style="color: #000000; font-weight: bold;">Confiido dashboard</a> or reply to this email.
      </p>
      
      <p style="color: #333333; line-height: 1.6; margin-top: 20px;">
        We look forward to supporting your journey!
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Confiido. All rights reserved.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: {
      name: 'Confiido',
      address: process.env.EMAIL_USER || 'noreply@confiido.in'
    },
    to,
    subject,
    text,
    html
  };

  const emailTransporter = getTransporter();
  await emailTransporter.sendMail(mailOptions);
  console.log(`✅ Session confirmation email sent to ${to}`);
};

/**
 * Sends session confirmation to mentor
 */
export const sendMentorSessionNotification = async (
  to: string,
  data: SessionConfirmationData
) => {
  const {
    userName,
    sessionDate,
    startTime,
    endTime,
    sessionTopic = 'Scheduled session',
    timeZone = 'IST',
    meetingLink
  } = data;

  const subject = `New Session Confirmed – ${sessionDate}`;

  const text = `Hello,

✓ You have a new confirmed session!

Session Details:
- Client: ${userName}
- Topic: ${sessionTopic}
- Date & Time: ${sessionDate}, ${startTime} – ${endTime} ${timeZone}
${meetingLink ? `- Join link: ${meetingLink}` : '- Join link: Will be generated shortly'}

Please prepare for the session and join on time.

Best regards,
The Confiido Team

© ${new Date().getFullYear()} Confiido. All rights reserved.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-style: italic;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
    }
    .success-message {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 30px;
      font-size: 16px;
      font-weight: bold;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-top: 30px;
      margin-bottom: 20px;
      text-align: center;
    }
    .details-box {
      background-color: #f8f9fa;
      border-left: 4px solid #000000;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .detail-row {
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 16px;
      color: #333333;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #000000;
      display: inline-block;
      min-width: 120px;
    }
    .detail-value {
      color: #333333;
    }
    .cta-button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #333333;
    }
    .warning-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONFIIDO</h1>
    </div>
    
    <div class="content">
      <div class="success-message">
        ✓ You have a new confirmed session!
      </div>
      
      <p class="greeting">Hello,</p>
      
      <p style="color: #333333; line-height: 1.6;">
        You have a confirmed session with <strong>${userName}</strong>. Please prepare for the session and join on time.
      </p>
      
      <div class="section-title">Session Details</div>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Client:</span>
          <span class="detail-value">${userName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Topic:</span>
          <span class="detail-value">${sessionTopic}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${sessionDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${startTime} – ${endTime} ${timeZone}</span>
        </div>
      </div>
      
      ${meetingLink ? `
        <div style="text-align: center;">
          <a href="${meetingLink}" class="cta-button">Join Session</a>
        </div>
        <p style="text-align: center; color: #666666; font-size: 14px; margin-top: 15px;">
          Or copy this link: <a href="${meetingLink}" style="color: #000000; word-break: break-all;">${meetingLink}</a>
        </p>
      ` : `
        <div class="warning-box">
          <strong>Meeting link will be generated shortly.</strong><br>
          You'll receive it before the scheduled session.
        </div>
      `}
      
      <p style="color: #333333; line-height: 1.6; margin-top: 30px;">
        Please prepare for the session and join on time. You can manage your sessions from your <a href="${process.env.FRONTEND_URL || 'https://www.confiido.in'}/mentor/dashboard" style="color: #000000; font-weight: bold;">Confiido dashboard</a>.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Confiido. All rights reserved.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: {
      name: 'Confiido',
      address: process.env.EMAIL_USER || 'noreply@confiido.in'
    },
    to,
    subject,
    text,
    html
  };

  const emailTransporter = getTransporter();
  await emailTransporter.sendMail(mailOptions);
  console.log(`✅ Mentor notification email sent to ${to}`);
};
