import { parseSavedTimes, type SavedTime } from './saved';
import { Bookmark, Trash2 } from 'lucide-react';
import { rebaseMeeting } from './time';
import ThemeToggle from './ThemeToggle';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Globe2,
  MapPin,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import {
  available,
  daySlots,
  defaults,
  loadCities,
  localParts,
  nextDate,
  popularCities,
  timeLabel,
  utcOffset,
  working,
  type City,
} from './time';
const durationOptions = [30, 60, 90, 120];
function fileDownload(text: string) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'overlap-meeting.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const icsDate = (t: number) =>
  new Date(t)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
export default function App() {
  const [savedTimes, setSavedTimes] = useState<SavedTime[]>(() => {
    try {
      return parseSavedTimes(localStorage.getItem('overlap-saved-times'));
    } catch {
      return [];
    }
  });
  const [slotTitle, setSlotTitle] = useState('Meeting'),
    [sideTab, setSideTab] = useState<'suggested' | 'saved'>('suggested');
  useEffect(() => {
    try {
      localStorage.setItem('overlap-saved-times', JSON.stringify(savedTimes));
    } catch {
      setNotice('Saved times are unavailable in this browser.');
    }
  }, [savedTimes]);
  const [cities, setCities] = useState<City[]>(loadCities),
    [date, setDate] = useState(() => localParts(Date.now(), 'Europe/Lisbon').date),
    [duration, setDuration] = useState(60),
    [index, setIndex] = useState(28),
    [weekends, setWeekends] = useState(false),
    [hour12, setHour12] = useState(false),
    [modal, setModal] = useState(false),
    [query, setQuery] = useState(''),
    [edit, setEdit] = useState<string | null>(null),
    [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null),
    copyArea = useRef<HTMLTextAreaElement>(null),
    [fallback, setFallback] = useState('');
  const slots = useMemo(() => daySlots(date, cities[0].zone), [date, cities[0].zone]);
  const lastIndex = Math.max(0, slots.length - duration / 30),
    safeIndex = Math.min(index, lastIndex),
    selected = slots[safeIndex],
    end = selected + duration * 60000;
  useEffect(() => {
    try {
      localStorage.setItem('overlap-cities', JSON.stringify(cities));
    } catch {
      setNotice('Browser storage is unavailable. Your cities will last for this visit.');
    }
  }, [cities]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const valid = available(selected, duration, cities, weekends);
  const suggestions = useMemo(
    () =>
      slots
        .filter((s, i) => i <= lastIndex && available(s, duration, cities, weekends))
        .filter(
          (s, i, list) =>
            i === 0 || s - list[i - 1] >= duration * 60000 || i % (duration / 30) === 0,
        ),
    [slots, lastIndex, duration, cities, weekends],
  );
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const known = [...popularCities];
    if (q.length > 1) {
      const supported =
        (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
          'timeZone',
        ) || [];
      for (const zone of supported) {
        if (
          !known.some((c) => c.zone === zone) &&
          zone.toLowerCase().replaceAll('_', ' ').includes(q)
        )
          known.push({ zone, name: zone.split('/').pop()!.replaceAll('_', ' ') });
      }
    }
    return known
      .filter(
        (c) =>
          !cities.some((x) => x.zone === c.zone) &&
          (!q || `${c.name} ${c.zone}`.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [query, cities]);
  function close() {
    setModal(false);
    setQuery('');
  }
  function updateCity(id: string, start: number, end: number) {
    if (start === end) {
      setNotice('Working hours need a different start and end.');
      return;
    }
    setCities((old) => old.map((c) => (c.id === id ? { ...c, start, end } : c)));
  }
  const summary = () =>
    `Meeting, ${duration} minutes\n` +
    cities
      .map(
        (c) =>
          `${c.name}: ${new Intl.DateTimeFormat('en-GB', { timeZone: c.zone, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(selected)}, ${timeLabel(selected, c.zone, hour12)} to ${timeLabel(end, c.zone, hour12)} (${utcOffset(selected, c.zone)})`,
      )
      .join('\n');
  async function copy() {
    const text = summary();
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Meeting times copied.');
    } catch {
      setFallback(text);
      setNotice('Select and copy the meeting times below.');
      setTimeout(() => copyArea.current?.select(), 0);
    }
  }
  function calendar() {
    fileDownload(
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Overlap//Meeting Planner//EN\r\nBEGIN:VEVENT\r\nUID:${crypto.randomUUID()}@overlap.local\r\nDTSTAMP:${icsDate(Date.now())}\r\nDTSTART:${icsDate(selected)}\r\nDTEND:${icsDate(end)}\r\nSUMMARY:Time together\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
    );
    setNotice('Calendar file downloaded. Add attendees in your calendar.');
  }
  return (
    <>
      <a className="skip" href="#planner">
        Skip to planner
      </a>
      <header className="topbar">
        <a className="brand" href="./">
          <img
            className="app-icon"
            src={import.meta.env.BASE_URL + 'favicon.svg?v=2'}
            width="28"
            height="28"
            alt=""
            aria-hidden="true"
          />
          Overlap
        </a>
        <span className="header-purpose">Time zone planner</span>
        <ThemeToggle />
      </header>
      <main>
        <div className="intro">
          <h1>Meeting planner</h1>
          <p>Compare working hours across time zones.</p>
        </div>
        <section id="planner" className="planner" aria-label="Meeting planner">
          <div className="planner-controls">
            <div className="date-picker">
              <button
                className="icon-button"
                aria-label="Previous day"
                onClick={() => setDate(nextDate(date, -1))}
              >
                <ChevronLeft size={16} />
              </button>
              <label>
                <CalendarDays size={14} />
                <input
                  type="date"
                  aria-label="Planning date"
                  value={date}
                  min="2000-01-01"
                  max="2100-12-31"
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      e.target.value >= '2000-01-01' &&
                      e.target.value <= '2100-12-31'
                    )
                      setDate(e.target.value);
                  }}
                />
              </label>
              <button
                className="icon-button"
                aria-label="Next day"
                onClick={() => setDate(nextDate(date))}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="today-button"
                onClick={() => setDate(localParts(Date.now(), cities[0].zone).date)}
              >
                Today
              </button>
            </div>
            <div className="control-right">
              <label className="duration">
                <Clock3 size={13} />
                <select
                  aria-label="Meeting duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {durationOptions.map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="format-toggle"
                aria-pressed={hour12}
                onClick={() => setHour12((h) => !h)}
              >
                {hour12 ? '12h' : '24h'}
              </button>
            </div>
          </div>
          <div className="timeline-heading">
            <div>
              <h2>Time zones</h2>
              <p>
                Timeline based on {cities[0].name} / {slots.length / 2}-hour day
              </p>
            </div>
            <div className="legend">
              <span>
                <i className="work" />
                Working hours
              </span>
              <span>
                <i className="off" />
                Outside hours
              </span>
            </div>
          </div>
          <div className="timeline-scroll">
            <div
              className="timeline-table"
              style={{ '--slots': slots.length } as React.CSSProperties}
            >
              <div className="ruler-row">
                <div className="city-column ruler-label">
                  {new Intl.DateTimeFormat('en-GB', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(date + 'T12:00Z'))}
                </div>
                <div className="ruler">
                  {slots.map((t, i) => {
                    const p = localParts(t, cities[0].zone);
                    return (
                      <button
                        key={t}
                        style={{ gridColumn: i + 1 }}
                        aria-label={`Select ${timeLabel(t, cities[0].zone)} ${utcOffset(t, cities[0].zone)}`}
                        onClick={() => setIndex(Math.min(i, lastIndex))}
                        tabIndex={p.minute === 0 ? 0 : -1}
                      >
                        {p.minute === 0 && p.hour % 3 === 0
                          ? hour12
                            ? new Intl.DateTimeFormat('en', {
                                timeZone: cities[0].zone,
                                hour: 'numeric',
                                hour12: true,
                              }).format(t)
                            : String(p.hour).padStart(2, '0')
                          : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
              {cities.map((city, i) => {
                const p = localParts(selected, city.zone),
                  isWork = working(selected, city, weekends);
                const dayDiff = p.date === date ? '' : p.date < date ? '−1 day' : '+1 day';
                return (
                  <div className="city-row" key={city.id}>
                    <div className="city-column">
                      <div className="city-name">
                        <h3>{city.name}</h3>
                        <p>
                          {utcOffset(selected, city.zone)}
                          <span>
                            {' '}
                            / {dayDiff || p.weekday}
                            {i === 0 ? ' / Reference' : ''}
                          </span>
                        </p>
                      </div>
                      <button
                        className="icon-button city-settings"
                        aria-label={'Working hours for ' + city.name}
                        onClick={() => setEdit(edit === city.id ? null : city.id)}
                      >
                        <span>Hours</span>
                      </button>
                    </div>
                    <div
                      className="timeline-track"
                      onClick={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        setIndex(
                          Math.min(
                            lastIndex,
                            Math.max(
                              0,
                              Math.floor(((e.clientX - bounds.left) / bounds.width) * slots.length),
                            ),
                          ),
                        );
                      }}
                    >
                      <div className="hour-blocks" aria-hidden="true">
                        {slots.map((t) => (
                          <span
                            key={t}
                            className={
                              working(t, city, weekends)
                                ? 'working'
                                : localParts(t, city.zone).hour < 7 ||
                                    localParts(t, city.zone).hour >= 21
                                  ? 'night'
                                  : 'off-hours'
                            }
                          />
                        ))}
                      </div>
                      <div
                        className={'selection ' + (valid ? 'good' : '')}
                        style={{
                          left: `${(safeIndex / slots.length) * 100}%`,
                          width: `${(duration / 30 / slots.length) * 100}%`,
                        }}
                      >
                        <span>{timeLabel(selected, city.zone, hour12)}</span>
                      </div>
                    </div>
                    <div className="local-time">
                      <strong>{timeLabel(selected, city.zone, hour12)}</strong>
                      <span className={isWork ? 'is-working' : ''}>
                        {isWork ? 'In working hours' : 'Outside hours'}
                      </span>
                    </div>
                    {edit === city.id && (
                      <div className="city-editor">
                        <span>{city.name}’s working hours</span>
                        <label>
                          From
                          <select
                            aria-label={`${city.name} work starts`}
                            value={city.start}
                            onChange={(e) => updateCity(city.id, Number(e.target.value), city.end)}
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Until
                          <select
                            aria-label={`${city.name} work ends`}
                            value={city.end}
                            onChange={(e) =>
                              updateCity(city.id, city.start, Number(e.target.value))
                            }
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h + 1} value={h + 1}>
                                {String(h + 1).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </label>
                        {i !== 0 && (
                          <button
                            className="reference-button"
                            onClick={() => {
                              const next = rebaseMeeting(selected, city.zone, duration);
                              setCities((old) => [city, ...old.filter((c) => c.id !== city.id)]);
                              setDate(next.date);
                              setIndex(next.index);
                              setEdit(null);
                              if (next.start !== selected)
                                setNotice(
                                  'Start time adjusted to the nearest valid 30-minute interval in the reference zone.',
                                );
                            }}
                          >
                            Use as reference
                          </button>
                        )}
                        {cities.length > 1 && (
                          <button
                            className="remove-city"
                            onClick={() => {
                              setCities((old) => old.filter((c) => c.id !== city.id));
                              setEdit(null);
                            }}
                          >
                            <Minus size={12} />
                            Remove city
                          </button>
                        )}
                        <button
                          className="icon-button"
                          onClick={() => setEdit(null)}
                          aria-label="Close working hours"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="add-city-row">
                <button onClick={() => setModal(true)} disabled={cities.length >= 8}>
                  <Plus size={15} />
                  Add a city<span>{cities.length}/8</span>
                </button>
              </div>
            </div>
          </div>
          <div className="slider-area">
            <div>
              <label className="start-time-field">
                <span>Start in {cities[0].name}</span>
                <select
                  aria-label="Meeting start time"
                  value={safeIndex}
                  onChange={(event) => setIndex(Number(event.target.value))}
                >
                  {slots.slice(0, lastIndex + 1).map((time, slotIndex) => (
                    <option key={time} value={slotIndex}>
                      {timeLabel(time, cities[0].zone, hour12)} ({utcOffset(time, cities[0].zone)})
                    </option>
                  ))}
                </select>
              </label>
              <strong>
                <span className="end-time-label">Ends</span>
                {timeLabel(end, cities[0].zone, hour12)}
                <small>{cities[0].name}</small>
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max={lastIndex}
              value={safeIndex}
              aria-label={`Meeting starts at ${timeLabel(selected, cities[0].zone, hour12)} in ${cities[0].name}`}
              onChange={(e) => setIndex(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>Start of day</span>
              <span>30-minute intervals</span>
              <span>End of day</span>
            </div>
          </div>
          <div className="planner-footer">
            <span>
              <Check size={12} />
              Daylight saving handled automatically
            </span>
            <label>
              <input
                type="checkbox"
                checked={weekends}
                onChange={(e) => setWeekends(e.target.checked)}
              />
              Include weekends
            </label>
            <button
              onClick={() => {
                setCities(defaults);
                setEdit(null);
                setNotice('Back to Lisbon, New York, and London.');
              }}
            >
              Reset cities
            </button>
          </div>
        </section>
        <section className="suggestions">
          <div className="suggestion-heading">
            <div className="suggestion-label">
              <div>
                <h2>
                  {valid
                    ? 'Available for all'
                    : suggestions.length
                      ? 'Outside working hours'
                      : 'No shared availability'}
                </h2>
                <p>
                  {valid
                    ? 'The full meeting fits within all working hours.'
                    : suggestions.length
                      ? 'Choose a suggested time or adjust the start time.'
                      : 'No shared working hours for this duration. Try another day, a shorter meeting, or different hours.'}
                </p>
              </div>
            </div>
            <div className="meeting-actions">
              <button className="button" onClick={calendar}>
                <CalendarDays size={14} />
                Calendar file
              </button>
              <button className="button primary" onClick={() => void copy()}>
                <Copy size={14} />
                Copy meeting times
              </button>
            </div>
          </div>
          <div className="side-tabs" aria-label="Meeting options">
            <button aria-pressed={sideTab === 'suggested'} onClick={() => setSideTab('suggested')}>
              Suggestions
            </button>
            <button aria-pressed={sideTab === 'saved'} onClick={() => setSideTab('saved')}>
              Saved times ({savedTimes.length})
            </button>
          </div>
          {sideTab === 'saved' && (
            <div className="saved-times">
              <label>
                Meeting name
                <input
                  maxLength={60}
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                />
              </label>
              <button
                className="button"
                disabled={!slotTitle.trim()}
                onClick={() => {
                  if (savedTimes.some((s) => s.start === selected && s.duration === duration)) {
                    setNotice('This time is already saved.');
                    return;
                  }
                  setSavedTimes((old) =>
                    [
                      {
                        id: crypto.randomUUID(),
                        title: slotTitle.trim(),
                        start: selected,
                        duration,
                      },
                      ...old,
                    ].slice(0, 6),
                  );
                  setNotice('Meeting time saved.');
                }}
              >
                <Bookmark size={14} />
                Save current time
              </button>
              {!savedTimes.length && (
                <p className="saved-empty">Save a few options to compare later.</p>
              )}
              {savedTimes.map((saved) => (
                <div className="saved-time" key={saved.id}>
                  <button
                    className="saved-open"
                    onClick={() => {
                      const next = rebaseMeeting(saved.start, cities[0].zone, saved.duration);
                      setDate(next.date);
                      setIndex(next.index);
                      setDuration(saved.duration);
                      setNotice(
                        next.start === saved.start
                          ? 'Saved time selected.'
                          : 'Saved time adjusted to the nearest 30-minute slot in the reference city.',
                      );
                    }}
                  >
                    <strong>{saved.title}</strong>
                    <span>
                      {new Intl.DateTimeFormat('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: cities[0].zone,
                      }).format(saved.start)}{' '}
                      / {saved.duration} min
                    </span>
                  </button>
                  <button
                    className="icon-button"
                    aria-label={'Remove saved time ' + saved.title}
                    onClick={() => setSavedTimes((old) => old.filter((s) => s.id !== saved.id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {sideTab === 'suggested' && suggestions.length > 0 && (
            <div className="suggestion-times">
              <span>Suggested start times</span>
              {suggestions.slice(0, 6).map((t) => (
                <button
                  key={t}
                  className={t === selected ? 'active' : ''}
                  onClick={() => setIndex(slots.indexOf(t))}
                >
                  {timeLabel(t, cities[0].zone, hour12)}
                  <ArrowRight size={11} />
                  {timeLabel(t + duration * 60000, cities[0].zone, hour12)}
                </button>
              ))}
              <small>in {cities[0].name}</small>
            </div>
          )}
          {fallback && (
            <label className="copy-fallback">
              Meeting summary
              <textarea ref={copyArea} readOnly value={fallback} rows={cities.length + 2} />
            </label>
          )}
        </section>
      </main>
      <dialog
        ref={dialog}
        onCancel={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="modal-heading">
          <span className="modal-icon">
            <Globe2 size={22} />
          </span>
          <button className="icon-button" onClick={close} aria-label="Close city picker">
            <X size={19} />
          </button>
        </div>
        <h2>Add time zone</h2>
        <p>Search for a city or an IANA time zone.</p>
        <label className="search">
          <MapPin size={16} />
          <input
            autoFocus
            placeholder="Search a city or timezone…"
            aria-label="Search cities and timezones"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="city-results">
          {results.length ? (
            results.map((c) => (
              <button
                key={c.name + c.zone}
                onClick={() => {
                  setCities((old) => [
                    ...old,
                    { ...c, id: crypto.randomUUID(), start: 9, end: 18 },
                  ]);
                  close();
                }}
              >
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.zone.replaceAll('_', ' ')}</small>
                </span>
                <span>
                  {utcOffset(selected, c.zone)}
                  <Plus size={15} />
                </span>
              </button>
            ))
          ) : (
            <div className="no-results">
              No cities found. Try a nearby city or an IANA timezone, such as Asia/Tokyo.
            </div>
          )}
        </div>
        <p className="modal-note">
          Working hours start at 09:00 to 18:00. You can change them per city.
        </p>
      </dialog>
      {notice && (
        <div className="toast" role="status">
          <Check size={15} />
          {notice}
        </div>
      )}
    </>
  );
}
