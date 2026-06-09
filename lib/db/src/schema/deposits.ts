import { pgTable, uuid, varchar, numeric, timestamp, text, boolean, jsonb } from 'drizzle-orm/pg-core';
import { merchants } from './merchants';

export const deposits = pgTable('deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  promptpayRef: varchar('promptpay_ref', { length: 100 }),
  qrPayload: text('qr_payload'),
  status: varchar('status', { length: 20 }).default('pending'),
  slipVerified: boolean('slip_verified').default(false),
  slipHash: varchar('slip_hash', { length: 64 }),
  expiresAt: timestamp('expires_at'),
  // Bill payment reference fields (tag 62)
  ref1: varchar('ref1', { length: 100 }),
  ref2: varchar('ref2', { length: 100 }),
  // Bank callback fields
  bankCallbackReceived: boolean('bank_callback_received').default(false),
  bankCallbackData: jsonb('bank_callback_data'),
  // RPA verification
  rpaVerifiedAt: timestamp('rpa_verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
