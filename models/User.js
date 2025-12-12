// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const roles = ['Admin', 'RMG', 'HR']; // Candidate removed

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },

    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: roles, required: true },

    avatar: { type: String },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    lastlogin: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

// compare password
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
export { roles };





// // models/User.js
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
// import validator from 'validator';

// const roles = ['Admin', 'RMG', 'HR', 'Candidate'];

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true, trim: true, maxlength: 100 },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     validate: [validator.isEmail, 'Invalid email'],
//   },
//   password: { type: String, required: true, minlength: 6, select: false },
//   role: { type: String, enum: roles, default: 'Candidate' },
//   avatar: { type: String }, // cloudinary url or file ref
//   company: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Company', // optional Company model reference; keep flexible
//     required: function () {
//       // Candidate might not require a company, but RMG/HR should
//       return ['RMG', 'HR'].includes(this.role);
//     },
//   },
//   lastlogin: { type: Date },
//   isActive: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now }
// });

// // hash password
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // instance method to compare password
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.models.User || mongoose.model('User', userSchema);
// export { roles };
