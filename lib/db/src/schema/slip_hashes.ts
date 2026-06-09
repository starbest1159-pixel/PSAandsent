import { pgTable, uuid, varchar, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const slipHashes = pgTable('slip_hashes', {
  id: uuid('id').primaryKey().defaultRandom(),
  hash: varchar('hash', { length: 64 }).notNull().unique(),
  depositId: uuid('deposit_id'),
  perceptualHash: varchar('perceptual_hash', { length: 16 }),
  ocrData: jsonb('ocr_data'),
  verificationReport: jsonb('verification_report'),
  overallScore: integer('overall_score'),
  createdAt: timestamp('created_at').defaultNow(),
});
