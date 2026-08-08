/** Monday 00:00:00.000 UTC of the ISO week containing `date`. */
export function startOfUtcWeek(date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Exclusive end: next Monday 00:00:00.000 UTC. */
export function endOfUtcWeek(date = new Date()): Date {
  const start = startOfUtcWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}
