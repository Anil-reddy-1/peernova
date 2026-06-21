export const parseDate = (d: any): Date | null => {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string' || typeof d === 'number') return new Date(d);
  if (d._seconds !== undefined) return new Date(d._seconds * 1000);
  if (d.seconds !== undefined) return new Date(d.seconds * 1000);
  return new Date(d);
};
