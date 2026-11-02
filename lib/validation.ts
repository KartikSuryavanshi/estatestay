import { z } from 'zod';
const stayFields = { checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), adults: z.coerce.number().int().min(1).max(8), children: z.coerce.number().int().min(0).max(6) };
const withValidStay = <T extends z.ZodTypeAny>(schema: T) => schema.superRefine((value: any, ctx) => {
  const checkIn = new Date(`${value.checkIn}T00:00:00Z`);
  const checkOut = new Date(`${value.checkOut}T00:00:00Z`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['checkOut'], message: 'Checkout must be after check-in.' });
});
export const searchSchema = withValidStay(z.object(stayFields));
export const bookingSchema = withValidStay(z.object({ ...stayFields, roomId: z.string().min(1), guestName: z.string().min(2).max(80), email: z.string().email(), phone: z.string().min(8).max(20), promoCode: z.string().trim().max(32).optional(), idempotencyKey: z.string().min(16).max(128).optional() }));
export const enquirySchema = z.object({ name: z.string().min(2), contact: z.string().min(5), message: z.string().min(10), source: z.enum(['WEBSITE', 'EMAIL', 'WHATSAPP']) });
