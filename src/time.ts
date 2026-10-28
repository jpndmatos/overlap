export type City = { id: string; name: string; zone: string; start: number; end: number };
const formatters = new Map<string, Intl.DateTimeFormat>();
export function localParts(time: number, zone: string) {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    formatters.set(zone, f);
  }
  const p = Object.fromEntries(f.formatToParts(time).map((p) => [p.type, p.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: p.weekday,
    date: `${p.year}-${p.month}-${p.day}`,
  };
}
export function midnight(date: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))
    throw new Error('Choose a valid date.');
  const target = Date.parse(date + 'T00:00:00Z');
  let guess = target;
  for (let i = 0; i < 5; i++) {
    const p = localParts(guess, zone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const next = guess + target - represented;
    if (next === guess) return guess;
    guess = next;
  }
  // A few timezones skip midnight on a DST change; use their first existing instant.
  for (let t = target - 18 * 3600000; t <= target + 18 * 3600000; t += 15 * 60000) {
    if (localParts(t, zone).date === date) return t;
  }
  throw new Error('This date does not exist in that timezone.');
}
export function nextDate(date: string, days = 1) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daySlots(date: string, zone: string) {
  const first = midnight(date, zone),
    end = midnight(nextDate(date), zone);
  return Array.from({ length: Math.round((end - first) / 1800000) }, (_, i) => first + i * 1800000);
}
export function working(time: number, city: City, weekends = false) {
  const p = localParts(time, city.zone);
  if (!weekends && ['Sat', 'Sun'].includes(p.weekday)) return false;
  const hour = p.hour + p.minute / 60;
  return city.start < city.end
    ? hour >= city.start && hour < city.end
    : hour >= city.start || hour < city.end;
}
export function available(start: number, duration: number, cities: City[], weekends = false) {
  return (
    cities.length > 0 &&
    cities.every((city) => {
      for (let m = 0; m < duration; m += 15) {
        if (!working(start + m * 60000, city, weekends)) return false;
      }
      return true;
    })
  );
}
export function timeLabel(time: number, zone: string, hour12 = false) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  }).format(time);
}
export function utcOffset(time: number, zone: string) {
  return (
    new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(time)
      .find((p) => p.type === 'timeZoneName')
      ?.value.replace('GMT', 'UTC') || 'UTC'
  );
}
export const popularCities = [
  ['Lisbon', 'Europe/Lisbon'],
  ['London', 'Europe/London'],
  ['New York', 'America/New_York'],
  ['San Francisco', 'America/Los_Angeles'],
  ['São Paulo', 'America/Sao_Paulo'],
  ['Berlin', 'Europe/Berlin'],
  ['Paris', 'Europe/Paris'],
  ['Amsterdam', 'Europe/Amsterdam'],
  ['Madrid', 'Europe/Madrid'],
  ['Rome', 'Europe/Rome'],
  ['Stockholm', 'Europe/Stockholm'],
  ['Warsaw', 'Europe/Warsaw'],
  ['Athens', 'Europe/Athens'],
  ['Istanbul', 'Europe/Istanbul'],
  ['Dubai', 'Asia/Dubai'],
  ['Mumbai', 'Asia/Kolkata'],
  ['Kathmandu', 'Asia/Kathmandu'],
  ['Singapore', 'Asia/Singapore'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Seoul', 'Asia/Seoul'],
  ['Hong Kong', 'Asia/Hong_Kong'],
  ['Shanghai', 'Asia/Shanghai'],
  ['Sydney', 'Australia/Sydney'],
  ['Auckland', 'Pacific/Auckland'],
  ['Honolulu', 'Pacific/Honolulu'],
  ['Toronto', 'America/Toronto'],
  ['Vancouver', 'America/Vancouver'],
  ['Mexico City', 'America/Mexico_City'],
  ['Buenos Aires', 'America/Argentina/Buenos_Aires'],
  ['Cape Town', 'Africa/Johannesburg'],
  ['Nairobi', 'Africa/Nairobi'],
  ['Cairo', 'Africa/Cairo'],
  ['Bangkok', 'Asia/Bangkok'],
  ['Jakarta', 'Asia/Jakarta'],
  ['Perth', 'Australia/Perth'],
  ['Adelaide', 'Australia/Adelaide'],
  ['Los Angeles', 'America/Los_Angeles'],
  ['Chicago', 'America/Chicago'],
  ['Denver', 'America/Denver'],
].map(([name, zone]) => ({ name, zone }));
export const defaults: City[] = [
  { id: 'lisbon', name: 'Lisbon', zone: 'Europe/Lisbon', start: 9, end: 18 },
  { id: 'new-york', name: 'New York', zone: 'America/New_York', start: 9, end: 18 },
  { id: 'london', name: 'London', zone: 'Europe/London', start: 9, end: 18 },
];
export function loadCities(): City[] {
  try {
    const saved = JSON.parse(localStorage.getItem('overlap-cities') || 'null');
    if (!Array.isArray(saved) || !saved.length || saved.length > 8) return defaults;
    for (const c of saved) {
      if (
        typeof c.id !== 'string' ||
        typeof c.name !== 'string' ||
        c.name.length > 80 ||
        typeof c.zone !== 'string' ||
        !Number.isInteger(c.start) ||
        !Number.isInteger(c.end) ||
        c.start < 0 ||
        c.start > 23 ||
        c.end < 1 ||
        c.end > 24 ||
        c.start === c.end
      )
        throw new Error('Invalid saved city');
      new Intl.DateTimeFormat('en', { timeZone: c.zone });
    }
    return saved;
  } catch {
    return defaults;
  }
}
