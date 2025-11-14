import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (to: string, firstName: string) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
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
        .onboarding-title {
          font-size: 20px;
          font-weight: bold;
          color: #000000;
          margin-top: 30px;
          margin-bottom: 20px;
          text-align: center;
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
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
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
            ✓ Your account has been successfully created!
          </div>
          
          <p class="greeting">Hello ${firstName},</p>
          
          <p style="color: #333333; line-height: 1.6;">
            Welcome to Confiido! We're excited to have you join our community of learners and mentors. 
            Your journey to finding the perfect mentor starts here.
          </p>
          
          <div class="onboarding-title">Your Onboarding Process</div>
          
          <ul class="steps">
            <li class="step">
              <span class="step-number">1</span>
              <span class="step-text">Choose your preferred mentor</span>
            </li>
            <li class="step">
              <span class="step-number">2</span>
              <span class="step-text">Check for availability</span>
            </li>
            <li class="step">
              <span class="step-number">3</span>
              <span class="step-text">Book a slot</span>
            </li>
            <li class="step">
              <span class="step-number">4</span>
              <span class="step-text">Complete payment</span>
            </li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
              Get Started Now
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Confiido. All rights reserved.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hello ${firstName},

Your account has been successfully created with Confiido!

Welcome to Confiido! We're excited to have you join our community of learners and mentors.

Your Onboarding Process:
1. Choose your preferred mentor
2. Check for availability
3. Book a slot
4. Complete payment

Get started now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard

© ${new Date().getFullYear()} Confiido. All rights reserved.
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Welcome to Confiido - Account Successfully Created!',
    text: textContent,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};
