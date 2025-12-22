// controllers/forgotPasswordController.js
import User from '../models/User.js';
import { resetPasswordTemplate } from '../utils/emailTemplates/resetPasswordTemplate.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request OTP for password reset
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpiry = otpExpiry;
  await user.save();

  const html = resetPasswordTemplate({ name: user.name, otp });

  await sendEmail({
    to: user.email,
    subject: 'Password Reset OTP',
    html,
    // context: { name: user.name, otp },
  });

  res.status(200).json({ message: 'OTP sent to your email.' });
};


// OTP validation controller
export const validateOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }
  const user = await User.findOne({ email });
  if (!user || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }
  res.status(200).json({ message: 'OTP is valid.' });
};

// Password change controller (after OTP validation)
export const changePassword = async (req, res, next) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }
  const user = await User.findOne({ email });
  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpiry || user.resetPasswordOTPExpiry < Date.now()) {
    return res.status(400).json({ message: 'OTP validation required or expired.' });
  }
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  await user.save();
  res.status(200).json({ message: 'Password changed successfully.' });
};
