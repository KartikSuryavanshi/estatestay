import { PrismaClient, Role, EnquiryCategory, EnquiryStatus } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();
const roomSeed = [
  ['Estate Classic Room', 2, 8500],
  ['Plantation View Room', 2, 10500],
  ['Premium Cottage', 3, 14500],
  ['Private Estate Villa', 4, 22000]
] as const;

async function main() {
  const passwordHash = hashPassword('estate2026');
  for (const [name, capacity, price] of roomSeed) {
    const room = await prisma.roomCategory.upsert({ where: { name }, update: {}, create: { name, capacity, basePrice: price, description: 'A considered retreat in the coffee estate.', images: [], amenities: ['Breakfast', 'Wi-Fi', 'Estate access'], active: true } });
    for (let i = 0; i < 120; i++) {
      const date = new Date(); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() + i);
      await prisma.dailyRate.upsert({ where: { roomCategoryId_date: { roomCategoryId: room.id, date } }, update: {}, create: { roomCategoryId: room.id, date, basePrice: price, gstRate: price > 12000 ? 18 : 12 } });
      await prisma.websiteAllotment.upsert({ where: { roomCategoryId_date: { roomCategoryId: room.id, date } }, update: {}, create: { roomCategoryId: room.id, date, allotment: name === 'Private Estate Villa' ? 2 : 8 } });
    }
  }
  const staff = await prisma.user.upsert({ where: { email: 'stay@estatestay.example' }, update: { passwordHash, role: Role.STAFF }, create: { name: 'EstateStay Staff', email: 'stay@estatestay.example', passwordHash, role: Role.STAFF } });
  const samples = [
    { ref: 'ENQ-4410', name: 'Ananya Rao', message: "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights.", category: EnquiryCategory.WEDDING },
    { ref: 'ENQ-4411', name: 'Rohan Mehta', message: 'Is a villa free 14-16 Nov for 2 adults and a child?', category: EnquiryCategory.ROOM_BOOKING },
    { ref: 'ENQ-4412', name: 'Karthik Iyer', message: 'Team of 45 wants a January offsite with a conference hall.', category: EnquiryCategory.CORPORATE_OFFSITE }
  ];
  for (const sample of samples) await prisma.enquiry.upsert({ where: { enquiryReference: sample.ref }, update: {}, create: { enquiryReference: sample.ref, senderName: sample.name, email: 'guest@example.com', source: 'WEBSITE', message: sample.message, category: sample.category, confidence: .95, assignedTo: staff.id, status: EnquiryStatus.OPEN, replyDraft: 'Thank you for reaching out to EstateStay. Our team will be in touch shortly.' } });
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
