import { RRule, rrulestr } from "rrule";
const days = [
  ["MO", "Mon", RRule.MO],
  ["TU", "Tue", RRule.TU],
  ["WE", "Wed", RRule.WE],
  ["TH", "Thu", RRule.TH],
  ["FR", "Fri", RRule.FR],
  ["SA", "Sat", RRule.SA],
  ["SU", "Sun", RRule.SU],
];
export const emptyRecurrence = {
  frequency: "none",
  interval: 1,
  weekdays: [],
  monthlyOrdinal: "",
  monthlyWeekday: "",
  until: "",
};
export function generateRRule(start, r) {
  if (r.frequency === "none" || !start) return null;
  const options = {
    dtstart: new Date(start),
    freq: RRule[r.frequency.toUpperCase()],
    interval: Number(r.interval) || 1,
  };
  if (r.frequency === "weekly" && r.weekdays.length)
    options.byweekday = days
      .filter(([code]) => r.weekdays.includes(code))
      .map(([, , day]) => day);
  if (r.frequency === "monthly" && r.monthlyOrdinal && r.monthlyWeekday) {
    const weekday = days.find(([code]) => code === r.monthlyWeekday)?.[2];
    options.byweekday = weekday?.nth(Number(r.monthlyOrdinal));
  }
  if (r.until) options.until = new Date(`${r.until}T23:59:59`);
  return new RRule(options).toString();
}
export function parseRecurrence(rule) {
  if (!rule) return emptyRecurrence;
  try {
    const o = rrulestr(rule).origOptions,
      day = o.byweekday?.[0];
    return {
      frequency: (RRule.FREQUENCIES[o.freq] || "NONE").toLowerCase(),
      interval: o.interval || 1,
      weekdays: (o.byweekday || [])
        .map(
          (item) =>
            days.find(([, , value]) => value.weekday === item.weekday)?.[0],
        )
        .filter(Boolean),
      monthlyOrdinal: day?.n || "",
      monthlyWeekday: day
        ? days.find(([, , value]) => value.weekday === day.weekday)?.[0] || ""
        : "",
      until: o.until?.toISOString().slice(0, 10) || "",
    };
  } catch {
    return emptyRecurrence;
  }
}
export default function RecurrenceBuilder({ value, onChange, start }) {
  const update = (patch) => onChange({ ...value, ...patch });
  const toggle = (day) =>
    update({
      weekdays: value.weekdays.includes(day)
        ? value.weekdays.filter((item) => item !== day)
        : [...value.weekdays, day],
    });
  return (
    <fieldset className="recurrence full">
      <legend>Repeats</legend>
      <label>
        Frequency
        <select
          value={value.frequency}
          onChange={(e) => update({ frequency: e.target.value })}
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      {value.frequency !== "none" && (
        <>
          <label>
            Every
            <input
              min="1"
              type="number"
              value={value.interval}
              onChange={(e) => update({ interval: e.target.value })}
            />
          </label>
          {value.frequency === "weekly" && (
            <div className="weekday-picker">
              {days.map(([code, label]) => (
                <button
                  className={value.weekdays.includes(code) ? "selected" : ""}
                  type="button"
                  key={code}
                  onClick={() => toggle(code)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {value.frequency === "monthly" && (
            <div className="monthly-rule">
              <label>
                On the
                <select
                  value={value.monthlyOrdinal}
                  onChange={(e) => update({ monthlyOrdinal: e.target.value })}
                >
                  <option value="">Same date each month</option>
                  <option value="1">First</option>
                  <option value="2">Second</option>
                  <option value="3">Third</option>
                  <option value="4">Fourth</option>
                  <option value="-1">Last</option>
                </select>
              </label>
              {value.monthlyOrdinal && (
                <label>
                  Weekday
                  <select
                    value={value.monthlyWeekday}
                    onChange={(e) => update({ monthlyWeekday: e.target.value })}
                  >
                    <option value="">Choose weekday</option>
                    {days.map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          <label>
            End repeat on
            <input
              type="date"
              value={value.until}
              onChange={(e) => update({ until: e.target.value })}
            />
          </label>
          <output>{generateRRule(start, value)}</output>
        </>
      )}
    </fieldset>
  );
}
