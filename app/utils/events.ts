import type { EventRow } from "~/types/domain"

export function toCalendarEvent(event: EventRow) {
  return {
    id: event.id,
    title: event.title,
    start: event.rrule ? undefined : event.start_at,
    end: event.rrule ? undefined : event.end_at || undefined,
    rrule: event.rrule || undefined,
    duration: event.end_at
      ? new Date(event.end_at).getTime() - new Date(event.start_at).getTime()
      : undefined,
    sourceStart: event.start_at,
    sourceEnd: event.end_at,
    bannerMessage: event.banner_message,
    extendedProps: {
      location: event.location,
      description: event.description,
      details: [event.location, event.description].filter(Boolean).join(" · "),
    },
  }
}

export function toLocalDateTime(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  const pad = (number: number) => String(number).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
