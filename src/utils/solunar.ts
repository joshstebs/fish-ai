// ============================================================================
// REAL ASTRONOMY: moon phase, sun times, solunar windows
// Standard NOAA-style approximations — deterministic, no API needed.
// ============================================================================
import { MoonInfo, SunTimes, SolunarPeriod } from '../types/catchLogTypes';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function daysSinceJ2000(d: Date): number {
  return julianDate(d) - 2451545.0;
}

/** Mean lunar phase angle (0 = new moon, 180 = full). */
function moonPhaseAngle(d: Date): number {
  const D = daysSinceJ2000(d);
  const sunMeanAnomaly = (357.5291 + 0.98560028 * D) * RAD;
  const moonMeanLongitude = (218.316 + 13.176396 * D) * RAD;
  const moonMeanAnomaly = (134.963 + 13.064993 * D) * RAD;
  const elongation = moonMeanLongitude - sunMeanAnomaly * DEG * RAD; // simplified ecliptic longitude diff
  const phase = (elongation * DEG) % 360;
  return phase < 0 ? phase + 360 : phase;
}

export function getMoonInfo(date: Date): MoonInfo {
  const phaseDeg = moonPhaseAngle(date);
  const illumination = (1 - Math.cos(phaseDeg * RAD)) / 2;

  // Scan forward for next new/full moon (max ~30 days out)
  const nextNewMoon = new Date(date);
  const nextFullMoon = new Date(date);
  for (let i = 1; i <= 40; i++) {
    const probe = new Date(date.getTime() + i * 86400000);
    const p = moonPhaseAngle(probe);
    if (p < 10 || p > 350) {
      nextNewMoon.setTime(probe.getTime());
      break;
    }
  }
  for (let i = 1; i <= 40; i++) {
    const probe = new Date(date.getTime() + i * 86400000);
    const p = moonPhaseAngle(probe);
    if (Math.abs(p - 180) < 10) {
      nextFullMoon.setTime(probe.getTime());
      break;
    }
  }

  // Synodic month ~29.53 days; age from last new moon
  const synodic = 29.53058867;
  const ageDays = (phaseDeg / 360) * synodic;

  let phaseName: string;
  if (illumination < 0.03) phaseName = 'New Moon';
  else if (phaseDeg < 90) phaseName = 'Waxing Crescent';
  else if (phaseDeg < 135) phaseName = 'First Quarter';
  else if (phaseDeg < 180) phaseName = 'Waxing Gibbous';
  else if (phaseDeg < 225) phaseName = 'Full Moon';
  else if (phaseDeg < 270) phaseName = 'Waning Gibbous';
  else if (phaseDeg < 315) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  return {
    illuminationPct: Math.round(illumination * 100),
    phaseName,
    ageDays: Math.round(ageDays * 10) / 10,
    nextNewMoon: nextNewMoon.toISOString(),
    nextFullMoon: nextFullMoon.toISOString(),
  };
}

/** NOAA-style sunrise/sunset for a date + coordinates (returns UTC dates). */
export function getSunTimes(date: Date, lat: number, lon: number): SunTimes | null {
  const D = daysSinceJ2000(date);
  const meanAnomaly = (357.5291 + 0.98560028 * D) * RAD;
  const equationOfCenter =
    1.9148 * Math.sin(meanAnomaly) +
    0.02 * Math.sin(2 * meanAnomaly) +
    0.0003 * Math.sin(3 * meanAnomaly);
  const eclipticLongitude = ((meanAnomaly * DEG + equationOfCenter + 180 + 102.9372) % 360) * RAD;

  const solarTransit = 2451545.0 + D + 0.0053 * Math.sin(meanAnomaly) - 0.0069 * Math.sin(2 * eclipticLongitude);
  const declination = Math.asin(Math.sin(eclipticLongitude) * Math.sin(23.4397 * RAD));

  const hourAngle = Math.acos(
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(declination)) /
      (Math.cos(lat * RAD) * Math.cos(declination))
  );

  const jdNoon = solarTransit - lon / 360;
  const jdSunrise = jdNoon - hourAngle / (2 * Math.PI);
  const jdSunset = jdNoon + hourAngle / (2 * Math.PI);

  if (isNaN(jdSunrise) || isNaN(jdSunset)) return null; // polar day/night

  const toDate = (jd: number) => new Date((jd - 2440587.5) * 86400000);
  return {
    sunrise: toDate(jdSunrise),
    sunset: toDate(jdSunset),
    solarNoon: toDate(jdNoon),
  };
}

/** Approx moon transit (upper culmination) time — the classic "moon overhead" moment. */
function getMoonTransit(date: Date, lat: number, lon: number): Date {
  // Moon rises ~50 min later each day; use solar transit of the moon's RA approximation.
  const D = daysSinceJ2000(date);
  const moonRA = ((218.316 + 13.176396 * D) % 360) * RAD;
  // Greenwich sidereal time at 0h UT
  const gst0 = (280.46061837 + 360.98564736629 * D) * RAD;
  const lst0 = (gst0 + lon * RAD) % (2 * Math.PI);
  const transitHourAngle = (lst0 - moonRA + 2 * Math.PI) % (2 * Math.PI);
  const transitHours = ((2 * Math.PI - transitHourAngle) / (2 * Math.PI)) * 24;
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  t.setTime(t.getTime() + transitHours * 3600000);
  return t;
}

/**
 * Solunar periods for a date + location:
 * - MAJOR: moon transit ±1h and anti-transit ±1h (moon overhead / underfoot)
 * - MINOR: ~±45 min around moonrise/moonset (approximated from transit + 6.2h offsets)
 */
export function getSolunarPeriods(date: Date, lat: number, lon: number): SolunarPeriod[] {
  const transit = getMoonTransit(date, lat, lon);
  const antiTransit = new Date(transit.getTime() + 12 * 3600000 + 25 * 60000);

  const periods: SolunarPeriod[] = [];
  const majorWindows = [
    { start: new Date(transit.getTime() - 60 * 60000), end: new Date(transit.getTime() + 60 * 60000), label: 'Moon overhead' },
    { start: new Date(antiTransit.getTime() - 60 * 60000), end: new Date(antiTransit.getTime() + 60 * 60000), label: 'Moon underfoot' },
  ];
  const minorWindows = [
    { start: new Date(transit.getTime() - 6 * 3600000 - 45 * 60000), end: new Date(transit.getTime() - 6 * 3600000 + 45 * 60000), label: 'Moonrise' },
    { start: new Date(antiTransit.getTime() + 6 * 3600000 - 45 * 60000), end: new Date(antiTransit.getTime() + 6 * 3600000 + 45 * 60000), label: 'Moonset' },
  ];

  majorWindows.forEach((w, i) => {
    periods.push({
      type: 'MAJOR',
      start: w.start,
      end: w.end,
      rating: i === 0 ? 'VERY HIGH' : 'HIGH',
      description: `${w.label} alignment — prime feeding window. Fish often move shallower and feed aggressively during major solunar periods.`,
    });
  });
  minorWindows.forEach((w) => {
    periods.push({
      type: 'MINOR',
      start: w.start,
      end: w.end,
      rating: 'MODERATE',
      description: `${w.label} — shorter feeding pulse. Good window to switch to active presentations.`,
    });
  });

  return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
