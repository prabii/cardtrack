const nodemailer = require('nodemailer');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CardTracker Pro - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CardTracker Pro</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              You requested to reset your password for your CardTracker Pro account. 
              Use the verification code below to complete the process:
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your Verification Code</h3>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.5; padding-left: 20px;">
              <li>This code will expire in 5 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent from CardTracker Pro. If you have any questions, please contact support.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail
};
