
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose, { Schema, Document, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const DRY_RUN = process.argv.includes('--dry-run');



interface ICustomer extends Document {
  customerId?: string;
  customerName: string;
  emailAddress: string;
  phoneNumber: string;
  customerAddress: string;
  isActive: boolean;
  createdAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: String,
    customerName: String,
    emailAddress: String,
    phoneNumber: String,
    customerAddress: String,
    isActive: { type: Boolean, default: true },
  },
  { collection: 'customers', timestamps: true },
);

interface IUser extends Document {
  fullName?: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  customerId?: string;
  phoneNumber?: string;
  customerAddress?: string;
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: String,
    email: { type: String, lowercase: true, trim: true },
    password: String,
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    customerId: { type: String, sparse: true },
    phoneNumber: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    // other fields (bio, avatar, etc.) are preserved — $set only touches what we list
  },
  { collection: 'users', timestamps: { createdAt: true, updatedAt: false } },
);

// ── Counters ──────────────────────────────────────────────────────────────────
const stats = {
  total: 0,
  merged: 0,
  created: 0,
  skipped: 0,
  errors: [] as { email: string; reason: string }[],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalisePhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/** Returns true if the value is a meaningful placeholder we should NOT keep. */
function isBlank(value?: string): boolean {
  if (!value) return true;
  const lower = value.trim().toLowerCase();
  return (
    lower === '' ||
    lower === 'not provided' ||
    lower === '0000000000' ||
    lower === 'n/a'
  );
}

async function generateUniqueCustomerId(
  UserModel: Model<IUser>,
): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = `#CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await UserModel.findOne({ customerId: candidate }).exec();
    if (!clash) return candidate;
  }
  // Fallback: hex suffix (virtually guaranteed unique)
  return `#CUST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  console.log(`\n🚀  Magnify — customer → user migration`);
  console.log(`    Mode : ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`    DB   : ${uri.replace(/:([^@]+)@/, ':****@')}\n`);

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB\n');

  const CustomerModel: Model<ICustomer> = mongoose.model('Customer', CustomerSchema);
  const UserModel: Model<IUser> = mongoose.model('User', UserSchema);

  const customers = await CustomerModel.find().lean().exec();
  stats.total = customers.length;

  console.log(`📦  Found ${stats.total} documents in 'customers' collection\n`);
  console.log('─'.repeat(72));

  for (const customer of customers) {
    const email = (customer.emailAddress ?? '').trim().toLowerCase();

    if (!email) {
      stats.skipped++;
      stats.errors.push({
        email: '(empty)',
        reason: `customerId=${customer.customerId ?? 'none'} — missing emailAddress field`,
      });
      console.log(`  ⚠️  SKIP  — no emailAddress (customerId: ${customer.customerId ?? 'none'})`);
      continue;
    }

    try {
      const existingUser = await UserModel.findOne({ email }).exec();

      if (existingUser) {
        // ── MERGE ────────────────────────────────────────────────────────────
        const patch: Record<string, any> = {};

        if (!existingUser.customerId && customer.customerId) {
          patch.customerId = customer.customerId;
        } else if (!existingUser.customerId) {
          patch.customerId = await generateUniqueCustomerId(UserModel);
        }

        if (isBlank(existingUser.phoneNumber) && !isBlank(normalisePhone(customer.phoneNumber))) {
          patch.phoneNumber = normalisePhone(customer.phoneNumber);
        }

        if (isBlank(existingUser.customerAddress) && !isBlank(customer.customerAddress)) {
          patch.customerAddress = customer.customerAddress;
        }

        if (!existingUser.fullName?.trim() && customer.customerName?.trim()) {
          patch.fullName = customer.customerName;
        }

        if (Object.keys(patch).length > 0) {
          if (!DRY_RUN) {
            await UserModel.updateOne({ _id: existingUser._id }, { $set: patch }).exec();
          }
          console.log(`  ✅  MERGE  ${email}  →  patched: ${Object.keys(patch).join(', ')}`);
        } else {
          console.log(`  ℹ️   MERGE  ${email}  →  already up-to-date, no patch needed`);
        }

        stats.merged++;
      } else {
        // ── CREATE ───────────────────────────────────────────────────────────
        const customerId =
          customer.customerId ?? (await generateUniqueCustomerId(UserModel));

        const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);

        if (!DRY_RUN) {
          await UserModel.create({
            email,
            fullName: customer.customerName,
            password: randomPassword,
            role: 'user',
            isActive: customer.isActive !== false,
            customerId,
            phoneNumber: normalisePhone(customer.phoneNumber),
            customerAddress: customer.customerAddress ?? '',
            // Preserve original createdAt if available
            ...(customer.createdAt ? { createdAt: customer.createdAt } : {}),
          });
        }

        console.log(`  ✅  CREATE ${email}  →  customerId=${customerId}`);
        stats.created++;
      }
    } catch (err: any) {
      stats.skipped++;
      stats.errors.push({ email, reason: err?.message ?? String(err) });
      console.log(`  ❌  ERROR  ${email}  →  ${err?.message ?? err}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(72));
  console.log('  MIGRATION SUMMARY');
  console.log('═'.repeat(72));
  console.log(`  Total records read  : ${stats.total}`);
  console.log(`  Merged into users   : ${stats.merged}`);
  console.log(`  New users created   : ${stats.created}`);
  console.log(`  Skipped / failed    : ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n  Failed records:');
    for (const e of stats.errors) {
      console.log(`    • ${e.email} — ${e.reason}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n  ⚠️   DRY RUN — no data was written to the database.');
  } else {
    console.log('\n  ✅  Migration complete.');
    console.log('  👉  Verify the users collection, then drop the customers');
    console.log('      collection manually and remove CustomerSchema from');
    console.log('      CustomerModule (see the NOTE comment in customer.module.ts).');
  }

  console.log('═'.repeat(72) + '\n');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
