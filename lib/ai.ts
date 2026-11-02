import { Enquiry } from './types';
import { z } from 'zod';
const aiOutput = z.object({ category: z.enum(['ROOM_BOOKING','WEDDING','CORPORATE_OFFSITE','COMPLAINT','UNSORTED']), confidence: z.number().min(0).max(1), extractedData: z.object({ eventDate: z.string().nullable(), guestCount: z.number().nullable(), nights: z.number().nullable(), budget: z.number().nullable() }), assignedTeam: z.string(), replyDraft: z.string() });
export function classifyFallback(message: string): Pick<Enquiry, 'category' | 'confidence' | 'extracted' | 'assigned' | 'replyDraft'> {
  const text = message.toLowerCase();
  if (/(wedding|marriage|bride|groom)/.test(text)) return { category: 'WEDDING', confidence: .87, extracted: 'Event details detected · AI fallback', assigned: 'Events team', replyDraft: 'Thank you for considering EstateStay. Our Events team will be in touch to understand your celebration and share suitable options.' };
  if (/(offsite|conference|team of|corporate)/.test(text)) return { category: 'CORPORATE_OFFSITE', confidence: .84, extracted: 'Corporate event detected · AI fallback', assigned: 'Events team', replyDraft: 'Thank you for reaching out about your offsite. Our Events team will share a tailored proposal shortly.' };
  if (/(late|unhappy|complaint|poor|issue)/.test(text)) return { category: 'COMPLAINT', confidence: .9, extracted: 'Service issue detected · AI fallback', assigned: 'General Manager', replyDraft: 'We are sorry to hear about your experience. Our General Manager is reviewing this and will contact you personally.' };
  if (/(room|villa|stay|adult|child|night|available|free)/.test(text)) return { category: 'ROOM_BOOKING', confidence: .82, extracted: 'Stay enquiry detected · AI fallback', assigned: 'Reservations', replyDraft: 'Thank you for writing to EstateStay. Our Reservations team will check the dates and accommodation options for you.' };
  return { category: 'UNSORTED', confidence: .42, extracted: 'Needs manual review', assigned: 'Front office', replyDraft: 'Thank you for reaching out to EstateStay. A member of our team will review your message and respond shortly.' };
}
export async function classifyEnquiry(message: string) {
  if (!process.env.OPENAI_API_KEY) return { ...classifyFallback(message), mode: 'deterministic-fallback' as const };
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Classify resort enquiries. Return only JSON with category, confidence, extractedData(eventDate,guestCount,nights,budget), assignedTeam, replyDraft. Never invent pricing or availability. Low confidence belongs in UNSORTED.' }, { role: 'user', content: message }] }) });
    if (!response.ok) throw new Error('OPENAI_UNAVAILABLE');
    const json = await response.json(); const parsed = aiOutput.parse(JSON.parse(json.choices?.[0]?.message?.content || '{}'));
    if (parsed.confidence < .65) parsed.category = 'UNSORTED';
    return { category: parsed.category, confidence: parsed.confidence, extracted: JSON.stringify(parsed.extractedData), assigned: parsed.assignedTeam, replyDraft: parsed.replyDraft, mode: 'openai' as const };
  } catch { return { ...classifyFallback(message), mode: 'deterministic-fallback' as const };
  }
}
