import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarSummary, extractEcbMeetings, extractFedMeetings } from './calendar-extract.mjs';

const fedRows = (dates) => dates.map(([month, days]) =>
  `<div class="row fomc-meeting"><div class="fomc-meeting__month"><strong>${month}</strong></div>
  <div class="fomc-meeting__date">${days}</div></div>`).join('');

test('Fed: extrae fechas futuras, incluidos meses abreviados y rangos entre meses', () => {
  const html = `<h4><a id="one">2026 FOMC Meetings</a></h4>${fedRows([
    ['January', '27-28'], ['March', '17-18'], ['April', '28-29'], ['June', '16-17'],
    ['July', '28-29'], ['September', '15-16*'], ['October', '27-28'], ['December', '8-9'],
  ])}<h4><a id="two">2027 FOMC Meetings</a></h4>${fedRows([
    ['January', '26-27'], ['March', '16-17*'], ['Apr/May', '30-1'], ['June', '8-9'],
    ['July', '27-28'], ['September', '14-15'], ['October', '26-27'], ['December', '7-8'],
  ])}`;
  const meetings = extractFedMeetings(html);
  assert.equal(meetings.length, 16);
  assert.deepEqual(meetings[6], { startDate: '2026-10-27', endDate: '2026-10-28' });
  assert.deepEqual(meetings[10], { startDate: '2027-04-30', endDate: '2027-05-01' });
  assert.deepEqual(calendarSummary(extractFedMeetings(html), '2026-11-01'), {
    total: 16, upcoming: 9,
    next: [
      { startDate: '2026-12-08', endDate: '2026-12-09' },
      { startDate: '2027-01-26', endDate: '2027-01-27' },
    ],
  });
});

test('BCE: solo toma el segundo día de reuniones monetarias', () => {
  const html = `<dl>
    <dt> 28/10/2026 </dt><dd>Governing Council of the ECB: monetary policy meeting (Day 1)</dd>
    <dt> 29/10/2026 </dt><dd>Governing Council of the ECB: monetary policy meeting (Day 2), followed by press conference</dd>
    <dt> 25/11/2026 </dt><dd>Governing Council of the ECB: non-monetary policy meeting</dd>
    <dt> 17/12/2026 </dt><dd>Governing Council of the ECB: monetary policy meeting (Day 2)</dd>
    </dl>`;
  assert.deepEqual(extractEcbMeetings(html), [
    { date: '2026-10-29' },
    { date: '2026-12-17' },
  ]);
});

test('rechaza cambios de estructura y fechas inválidas', () => {
  assert.throws(() => extractFedMeetings('<p>October 27-28</p>'), /FED_CALENDAR_SHAPE_CHANGED/);
  assert.throws(() => extractFedMeetings(`<h4><a>2027 FOMC Meetings</a></h4>${fedRows([
    ['January', '26-27'], ['March', '16-17'], ['April', '27-28'], ['June', '8-9'],
    ['July', '27-28'], ['September', '14-15'], ['October', '26-27'],
  ])}`), /FED_CALENDAR_SHAPE_CHANGED/);
  assert.throws(() => extractEcbMeetings('<p>29\/10\/2026</p>'), /ECB_CALENDAR_SHAPE_CHANGED/);
  assert.throws(() => extractEcbMeetings('<dt>31/02/2027</dt><dd>Governing Council of the ECB: monetary policy meeting (Day 2)</dd>'), /INVALID_CALENDAR_DATE/);
});
