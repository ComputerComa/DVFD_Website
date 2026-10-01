import { RRule, rrulestr, type Weekday } from "rrule"

export interface RecurrenceValue {
  frequency: "none" | "daily" | "weekly" | "monthly" | "yearly"
  interval: number | string
  weekdays: string[]
  monthlyOrdinal: number | string
  monthlyWeekday: string
  until: string
}

export const recurrenceDays: Array<[string, string, Weekday]> = [
  ["MO", "Mon", RRule.MO],
  ["TU", "Tue", RRule.TU],
  ["WE", "Wed", RRule.WE],
  ["TH", "Thu", RRule.TH],
  ["FR", "Fri", RRule.FR],
  ["SA", "Sat", RRule.SA],
  ["SU", "Sun", RRule.SU],
]

export const emptyRecurrence = (): RecurrenceValue => ({
  frequency: "none",
  interval: 1,
  weekdays: [],
  monthlyOrdinal: "",
  monthlyWeekday: "",
  until: "",
})

export function generateRRule(start: string, recurrence: RecurrenceValue) {
  if (recurrence.frequency === "none" || !start) return null
  const frequencies = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  }
  const options: ConstructorParameters<typeof RRule>[0] = {
    dtstart: new Date(start),
    freq: frequencies[recurrence.frequency],
    interval: Number(recurrence.interval) || 1,
  }
  if (recurrence.frequency === "weekly" && recurrence.weekdays.length) {
    options.byweekday = recurrenceDays
      .filter(([code]) => recurrence.weekdays.includes(code))
      .map(([, , day]) => day)
  }
  if (
    recurrence.frequency === "monthly" &&
    recurrence.monthlyOrdinal &&
    recurrence.monthlyWeekday
  ) {
    const weekday = recurrenceDays.find(
      ([code]) => code === recurrence.monthlyWeekday,
    )?.[2]
    options.byweekday = weekday?.nth(Number(recurrence.monthlyOrdinal))
  }
  if (recurrence.until) {
    options.until = new Date(`${recurrence.until}T23:59:59`)
  }
  return new RRule(options).toString()
}

export function parseRecurrence(rule?: string | null): RecurrenceValue {
  if (!rule) return emptyRecurrence()
  try {
    const options = rrulestr(rule).origOptions
    const parsedDays = (Array.isArray(options.byweekday)
      ? options.byweekday
      : options.byweekday
        ? [options.byweekday]
        : []) as Weekday[]
    const firstDay = parsedDays[0]
    return {
      frequency: (RRule.FREQUENCIES[options.freq ?? RRule.DAILY] || "NONE").toLowerCase() as RecurrenceValue["frequency"],
      interval: options.interval || 1,
      weekdays: parsedDays
        .map(
          (item) =>
            recurrenceDays.find(([, , value]) => value.weekday === item.weekday)?.[0],
        )
        .filter((value): value is string => Boolean(value)),
      monthlyOrdinal: firstDay?.n || "",
      monthlyWeekday: firstDay
        ? recurrenceDays.find(([, , value]) => value.weekday === firstDay.weekday)?.[0] || ""
        : "",
      until: options.until?.toISOString().slice(0, 10) || "",
    }
  } catch {
    return emptyRecurrence()
  }
}

const weekdayNumbers: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
}

export function matchesMonthlyOrdinal(start: string, recurrence: RecurrenceValue) {
  if (
    recurrence.frequency !== "monthly" ||
    !recurrence.monthlyOrdinal ||
    !recurrence.monthlyWeekday
  ) {
    return true
  }
  const date = new Date(start)
  if (date.getDay() !== weekdayNumbers[recurrence.monthlyWeekday]) return false
  const isLast =
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !==
    date.getMonth()
  return String(recurrence.monthlyOrdinal) === "-1"
    ? isLast
    : Math.ceil(date.getDate() / 7) === Number(recurrence.monthlyOrdinal)
}
