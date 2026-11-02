import { z } from 'zod';
export const searchSchema = z.object({ checkIn: z.string().min(1), checkOut: z.string().min(1), adults: z.coerce.number().int().min(1).max(8), children: z.coerce.number().int().min(0).max(6) });
export const bookingSchema = searchSchema.extend({ roomId: z.string().min(1), guestName: z.string().min(2).max(80), email: z.string().email(), phone: z.string().min(8).max(20), promoCode: z.string().optional(), idempotencyKey: z.string().min(16).max(128).optional() });
export const enquirySchema = z.object({ name: z.string().min(2), contact: z.string().min(5), message: z.string().min(10), source: z.enum(['WEBSITE', 'EMAIL', 'WHATSAPP']) });
