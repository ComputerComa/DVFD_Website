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
            end: event.rrule ? undefined : event.end_at,
            rrule: event.rrule || undefined,
            duration: event.end_at
              ? new Date(event.end_at).getTime() - new Date(event.start_at).getTime()
              : undefined,
            location: event.location,
            description: event.description,
            extendedProps: {
              details: [event.location, event.description]
                .filter(Boolean)
                .join(" · "),
            },
          })),
        );
      });
  }, []);
  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

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
              details:
                info.event.extendedProps.description ||
                info.event.extendedProps.details,
              location: info.event.extendedProps.location,
            });
          }}
        />
      </section>
      {selected && (
        <div className="event-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="event-modal-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close event details"
            >
              ×
            </button>
            <p className="event-label">Event details</p>
            <h2 id="event-modal-title">{selected.title}</h2>
            <div className="event-modal-content">
              <div>
                <p>{selected.details || "More details will be shared soon."}</p>
                {selected.location && (
                  <p className="event-modal-location">{selected.location}</p>
                )}
              </div>
              {selected.location && (
                <div className="event-modal-map">
                  <iframe
                    title={`Map for ${selected.title}`}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(selected.location)}&output=embed`}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.location)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Maps →
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
