export type Night = { date: string; allotment: number; confirmed: number; holds: number };
/**
 * Inventory is consumed per night [checkIn, checkOut). A production reservation
 * transaction creates one BookingNight per returned date under a unique
 * (roomCategoryId, date) constraint. A conflicting insert rolls back the whole
 * transaction, so concurrent requests cannot partially reserve a stay.
 */
export function availableInventory(night: Night) { return Math.max(0, night.allotment - night.confirmed - night.holds); }
export function canReserve(nights: Night[]) { return nights.length > 0 && nights.every(n => availableInventory(n) > 0); }
export function stayDates(checkIn: string, checkOut: string) { const dates: string[]=[]; for(let d=new Date(`${checkIn}T00:00:00Z`), end=new Date(`${checkOut}T00:00:00Z`); d<end; d.setUTCDate(d.getUTCDate()+1)) dates.push(d.toISOString().slice(0,10)); return dates; }
