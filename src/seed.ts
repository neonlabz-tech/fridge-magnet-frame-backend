import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI as string;

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  fullName: { type: String },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String },
});

const Admin = mongoose.model('Admin', AdminSchema);
const User = mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const email =process.env.ADMIN_EMAIL;

  // Remove admin from User collection if it exists
  const deletedUser = await User.deleteOne({ email, role: 'admin' });
  if (deletedUser.deletedCount > 0) {
    console.log('🗑️  Removed old admin from User collection');
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists in Admin collection, skipping.');
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);

  await Admin.create({
    email,
    password,
    role: 'admin',
    isActive: true,
    fullName: 'Admin',
  });

  console.log('✅ Admin created in Admin collection: ' + email);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
