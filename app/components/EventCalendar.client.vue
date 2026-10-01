<script setup lang="ts">
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import rrulePlugin from "@fullcalendar/rrule"
import type { CalendarOptions, EventClickArg } from "@fullcalendar/core"
import type { EventRow, SelectedEvent } from "~/types/domain"
import { toCalendarEvent } from "~/utils/events"

const props = withDefaults(
  defineProps<{
    events: EventRow[]
    compact?: boolean
  }>(),
  { compact: false },
)

const selected = ref<SelectedEvent | null>(null)
const options = computed<CalendarOptions>(() => ({
  plugins: [
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    interactionPlugin,
    rrulePlugin,
  ],
  initialView: props.compact ? "listWeek" : "dayGridMonth",
  headerToolbar: props.compact
    ? { left: "prev,next", center: "title", right: "today" }
    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" },
  height: "auto",
  timeZone: "local",
  events: props.events.map(toCalendarEvent),
  eventClick(info: EventClickArg) {
    info.jsEvent.preventDefault()
    selected.value = {
      title: info.event.title,
      details:
        info.event.extendedProps.description || info.event.extendedProps.details,
      location: info.event.extendedProps.location,
    }
  },
}))
</script>

<template>
  <FullCalendar :options="options" />
  <EventDetailsModal :event="selected" @close="selected = null" />
</template>
