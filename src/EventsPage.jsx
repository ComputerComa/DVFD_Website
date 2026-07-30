import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import { supabase } from "./lib/supabase";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .then(({ data }) => {
        setEvents(
          (data || []).map((event) => ({
            id: event.id,
            title: event.title,
            start: event.rrule ? undefined : event.start_at,
            rrule: event.rrule || undefined,
            duration: event.end_at
              ? new Date(event.end_at).getTime() - new Date(event.start_at).getTime()
              : undefined,
            extendedProps: {
              details: [event.location, event.description]
                .filter(Boolean)
                .join(" · "),
            },
          })),
        );
      });
  }, []);

  return (
    <main className="events-page">
      <header className="events-header">
        <a href="/" className="error-brand">
          <span>✦</span>Deshler<br />Fire &amp; Rescue
        </a>
        <a className="button" href="/">
          Return home
        </a>
      </header>
      <section className="events-calendar">
        <p className="eyebrow">Community calendar</p>
        <h1>Upcoming events</h1>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          height="auto"
          events={events}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            setSelected({
              title: info.event.title,
              details: info.event.extendedProps.details,
            });
          }}
        />
        {selected && (
          <aside className="event-detail">
            <p className="event-label">Event details</p>
            <h2>{selected.title}</h2>
            <p>{selected.details || "More details will be shared soon."}</p>
          </aside>
        )}
      </section>
    </main>
  );
}
