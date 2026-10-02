// Exploración de calendarios oficiales: fechas civiles, nunca horas de publicación.
const MONTHS = new Map([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((month, index) => [month, index + 1]));
for (const [abbreviation, full] of [
  ['Jan', 'January'], ['Feb', 'February'], ['Apr', 'April'], ['Oct', 'October'], ['Nov', 'November'],
]) MONTHS.set(abbreviation, MONTHS.get(full));

function isoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new Error('INVALID_CALENDAR_DATE');
  }
  return date.toISOString().slice(0, 10);
}

export function extractFedMeetings(html) {
  const headings = [...html.matchAll(/<h4><a[^>]*>(20\d{2}) FOMC Meetings<\/a><\/h4>/g)];
  if (!headings.length) throw new Error('FED_CALENDAR_SHAPE_CHANGED');
  const meetings = [];
  for (const [index, heading] of headings.entries()) {
    const year = Number(heading[1]);
    const section = html.slice(heading.index, headings[index + 1]?.index ?? html.length);
    const rows = [...section.matchAll(/fomc-meeting__month[^>]*>\s*<strong>([A-Za-z/]+)<\/strong>[\s\S]{0,500}?fomc-meeting__date[^>]*>\s*(\d{1,2})-(\d{1,2})\*?\s*</g)];
    if (rows.length !== 8) throw new Error('FED_CALENDAR_SHAPE_CHANGED');
    for (const row of rows) {
      const [firstMonth, lastMonth = firstMonth] = row[1].split('/');
      const startMonth = MONTHS.get(firstMonth);
      const endMonth = MONTHS.get(lastMonth);
      if (!startMonth || !endMonth) throw new Error('FED_CALENDAR_SHAPE_CHANGED');
      const startDate = isoDate(year, startMonth, Number(row[2]));
      const endYear = endMonth < startMonth ? year + 1 : year;
      const endDate = isoDate(endYear, endMonth, Number(row[3]));
      if (endDate < startDate) throw new Error('FED_CALENDAR_SHAPE_CHANGED');
      meetings.push({ startDate, endDate });
    }
  }
  if (!meetings.length) throw new Error('FED_CALENDAR_SHAPE_CHANGED');
  return meetings;
}

export function extractEcbMeetings(html) {
  const meetings = [];
  const entries = [...html.matchAll(/<dt>\s*(\d{2})\/(\d{2})\/(20\d{2})\s*<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)];
  if (!entries.length) throw new Error('ECB_CALENDAR_SHAPE_CHANGED');
  for (const [, day, month, year, description] of entries) {
    if (!/Governing Council of the ECB:\s*monetary policy meeting/i.test(description) ||
        !/\(Day 2\)/i.test(description)) continue;
    meetings.push({ date: isoDate(Number(year), Number(month), Number(day)) });
  }
  if (!meetings.length) throw new Error('ECB_CALENDAR_SHAPE_CHANGED');
  return meetings;
}

export function calendarSummary(meetings, today = new Date().toISOString().slice(0, 10)) {
  const upcoming = meetings.filter((meeting) => (meeting.startDate ?? meeting.date) >= today)
    .sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date));
  return { total: meetings.length, upcoming: upcoming.length, next: upcoming.slice(0, 2) };
}
