// utils/generatePassword.js
import crypto from 'crypto';

const generatePassword = (length = 12) => {
  // create a URL-safe base64 and trim to length, then ensure it contains required classes
  let pwd = crypto.randomBytes(Math.ceil(length * 1.5)).toString('base64').replace(/[+/=]/g, '');
  pwd = pwd.slice(0, length);

  // ensure at least one lower, upper, digit, special
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%*()-_+=';
  // if missing, replace some chars
  if (!/[a-z]/.test(pwd)) pwd = pwd.slice(0, length - 4) + lower[Math.floor(Math.random() * lower.length)];
  if (!/[A-Z]/.test(pwd)) pwd = pwd.slice(0, length - 3) + upper[Math.floor(Math.random() * upper.length)];
  if (!/[0-9]/.test(pwd)) pwd = pwd.slice(0, length - 2) + digits[Math.floor(Math.random() * digits.length)];
  if (!/[!@#$%*()\-_\+=]/.test(pwd)) pwd = pwd.slice(0, length - 1) + special[Math.floor(Math.random() * special.length)];

  return pwd;
};

export default generatePassword;
