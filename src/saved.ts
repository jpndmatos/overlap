export type SavedTime = { id: string; title: string; start: number; duration: number };
export function parseSavedTimes(text: string | null): SavedTime[] {
  try {
    const data: unknown = JSON.parse(text || '[]');
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (x): x is SavedTime =>
          !!x &&
          typeof x.id === 'string' &&
          typeof x.title === 'string' &&
          x.title.trim().length > 0 &&
          x.title.length <= 60 &&
          Number.isFinite(x.start) &&
          x.start >= Date.UTC(2000, 0, 1) &&
          x.start < Date.UTC(2101, 0, 1) &&
          [30, 60, 90, 120].includes(x.duration),
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}
