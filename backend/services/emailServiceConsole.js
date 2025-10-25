// Simple console-based email service for testing
const sendOTPEmail = async (email, otp) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📧 OTP EMAIL SENT (Console Mode)');
    console.log('='.repeat(60));
    console.log(`📬 To: ${email}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`⏰ Expires: 5 minutes`);
    console.log('='.repeat(60));
    console.log('💡 In production, this would be sent via email service');
    console.log('='.repeat(60) + '\n');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { 
      success: true, 
      messageId: `console-${Date.now()}`,
      message: 'OTP displayed in console for testing'
    };
  } catch (error) {
    console.error('Error in console email service:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail
};
