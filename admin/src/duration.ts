export function formatDuration(seconds: number): string {
  return [seconds / 60, seconds % 60].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':');
}

export function parseDuration(formatted: string): number {
  const parts = formatted.split(":");
  if (parts.length != 2) {
    return NaN;
  }
  const [min, sec] = parts;
  let duration = Number.parseInt(min) * 60;
  duration += Number.parseInt(sec);
  return duration;
}

