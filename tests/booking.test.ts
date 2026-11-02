import { describe, expect, it } from 'vitest';
import { calculatePrice, nightsBetween } from '../lib/utils';
import { classifyFallback } from '../lib/ai';
describe('booking rules',()=>{
  it('calculates GST from the configured tariff',()=>expect(calculatePrice(10000,12,2)).toEqual({base:20000,tax:2400,total:22400}));
  it('does not consume checkout night',()=>expect(nightsBetween('2026-11-02','2026-11-05')).toBe(3));
  it('routes complaints to the GM in fallback mode',()=>expect(classifyFallback('The airport transfer was late and we are unhappy').assigned).toBe('General Manager'));
  it('sends ambiguous messages to unsorted',()=>expect(classifyFallback('Can you tell me more?').category).toBe('UNSORTED'));
  it('classifies all supplied sample enquiries',()=>{
    expect(classifyFallback("Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights.").category).toBe('WEDDING');
    expect(classifyFallback('Is a villa free 14-16 Nov for 2 adults and a child?').category).toBe('ROOM_BOOKING');
    expect(classifyFallback('Team of 45 wants a January offsite with a conference hall.').category).toBe('CORPORATE_OFFSITE');
  });
});
