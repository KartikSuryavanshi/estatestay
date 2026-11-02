import { describe, expect, it } from 'vitest';
import { availableInventory, canReserve, stayDates } from '../lib/inventory';
describe('EstateStay inventory',()=>{
  it('subtracts confirmed bookings and active holds',()=>expect(availableInventory({date:'2026-11-02',allotment:8,confirmed:3,holds:2})).toBe(3));
  it('never permits a multi-night stay when one night is full',()=>expect(canReserve([{date:'2026-11-02',allotment:2,confirmed:1,holds:0},{date:'2026-11-03',allotment:2,confirmed:2,holds:0}])).toBe(false));
  it('treats checkout as non-consumed',()=>expect(stayDates('2026-11-02','2026-11-05')).toEqual(['2026-11-02','2026-11-03','2026-11-04']));
  it('reserves only when every night has capacity',()=>expect(canReserve([{date:'a',allotment:2,confirmed:0,holds:1},{date:'b',allotment:2,confirmed:0,holds:1}])).toBe(true));
});
