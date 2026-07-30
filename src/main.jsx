import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import { rrulestr } from "rrule";
import AdminEvents from "./AdminEvents";
import AdminUsers from "./AdminUsers";
import AdminGate from "./AdminGate";
import AdminLogin from "./AdminLogin";
import AdminLogout from "./AdminLogout";
import AdminForgotPassword from "./AdminForgotPassword";
import AdminResetPassword from "./AdminResetPassword";
import AdminAuthCallback from "./AdminAuthCallback";
import ErrorPage from "./ErrorPage";
import EventsPage from "./EventsPage";
import { supabase } from "./lib/supabase";
import "./styles.css";
import "./calendar.css";
import "./admin.css";
import "./recurrence.css";
import "./error.css";
import "./events-page.css";
import { Facebook, TelephoneFill } from "react-bootstrap-icons";

const services = [
  [
    "01",
    "Fire response",
    "Rapid response for home, business, vehicle, grass, and rural fire incidents.",
  ],
  [
    "02",
    "Rescue & EMS",
    "Compassionate emergency medical care and rescue support when every second counts.",
  ],
  [
    "03",
    "Storm response",
    "Prepared for severe weather, accidents, and the unexpected across our community.",
  ],
];

function eventBannerIsActive(event, now) {
  if (!event.bannerMessage || !event.sourceEnd) return false;
  const end = new Date(event.sourceEnd);
  const duration = end.getTime() - new Date(event.sourceStart).getTime();
  if (duration <= 0) return false;

  if (!event.rrule) {
    const start = new Date(event.sourceStart);
    return now >= start && now < end;
  }

  try {
    const occurrence = rrulestr(event.rrule).before(now, true);
    return (
      occurrence &&
      now >= occurrence &&
      now < new Date(occurrence.getTime() + duration)
    );
  } catch {
    return false;
  }
}

function App() {
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [banner, setBanner] = useState(null);
  const [nwsAlerts, setNwsAlerts] = useState([]);
  const [clock, setClock] = useState(() => new Date());
  const [events, setEvents] = useState([
    {
      title: "National Night Out",
      start: "2026-08-04",
      location: "Deshler City Park, Deshler, NE",
      extendedProps: { details: "6:00 PM · Deshler City Park" },
    },
    {
      title: "Open House & Apparatus Tour",
      start: "2026-08-15",
      location: "404 E Pearl Ave, Deshler, NE 68340",
      extendedProps: { details: "10:00 AM · Fire Station" },
    },
    {
      title: "Annual Pancake Feed",
      start: "2026-09-05",
      location: "Deshler Legion Hall, Deshler, NE",
      extendedProps: { details: "7:00 AM · Deshler Legion Hall" },
    },
  ]);
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .then(({ data, error }) => {
        if (error || !data) return;
        setEvents(
          data.map((event) => ({
            id: event.id,
            title: event.title,
            start: event.rrule ? undefined : event.start_at,
            end: event.rrule ? undefined : event.end_at,
            rrule: event.rrule || undefined,
            duration: event.end_at
              ? new Date(event.end_at).getTime() -
                new Date(event.start_at).getTime()
              : undefined,
            sourceStart: event.start_at,
            sourceEnd: event.end_at,
            bannerMessage: event.banner_message,
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
    const timer = window.setInterval(() => setClock(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selectedEvent) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);
  useEffect(() => {
    if (!supabase) return;

    let disposed = false;
    const loadBanner = async () => {
      const { data, error } = await supabase
        .from("site_banners")
        .select("message, enabled, starts_at, ends_at")
        .eq("id", 1)
        .maybeSingle();

      if (!disposed && !error) setBanner(data);
    };

    loadBanner();

    const channel = supabase
      .channel("public-site-banner")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_banners",
          filter: "id=eq.1",
        },
        loadBanner,
      )
      .subscribe();

    // Keeps the banner current if a browser or network blocks its WebSocket.
    const refreshTimer = window.setInterval(loadBanner, 30 * 1000);

    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function loadNwsAlerts() {
      try {
        const response = await fetch(
          "https://api.weather.gov/alerts/active?point=40.14,-97.72",
          {
            headers: { Accept: "application/geo+json" },
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("NWS alert request failed");
        const data = await response.json();
        setNwsAlerts(
          (data.features || [])
            .map(
              (alert) => alert.properties?.headline || alert.properties?.event,
            )
            .filter(Boolean)
            .slice(0, 4),
        );
      } catch (error) {
        if (error.name !== "AbortError") setNwsAlerts([]);
      }
    }

    loadNwsAlerts();
    const refresh = window.setInterval(loadNwsAlerts, 5 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(refresh);
    };
  }, []);
  const now = clock;
  const manualBannerActive =
    banner?.enabled &&
    banner.message &&
    (!banner.starts_at || new Date(banner.starts_at) <= now) &&
    (!banner.ends_at || new Date(banner.ends_at) > now);
  const bannerMessages = [
    ...(manualBannerActive ? [`Department update: ${banner.message}`] : []),
    ...nwsAlerts.map((alert) => `NWS alert: ${alert}`),
    ...events
      .filter((event) => eventBannerIsActive(event, now))
      .map((event) => `Event notice — ${event.title}: ${event.bannerMessage}`),
  ];
  const displayBannerMessages = bannerMessages.map((message) =>
    message
      .replace(/^Department update:\s*/, "")
      .replace(/^NWS alert:\s*/, "")
      .replace(/^Event notice — .*?:\s*/, ""),
  );
  return (
    <>
      {displayBannerMessages.length > 0 && (
        <aside className="site-banner" aria-label="" aria-live="polite">
          <div className="site-banner-track">
            <span>{displayBannerMessages.join("  •  ")}</span>
            <span aria-hidden="true">{displayBannerMessages.join("  •  ")}</span>
          </div>
        </aside>
      )}

      <header>
        <div className="wrap nav">
          <a className="brand" href="#home">
            <img className="brand-logo" src="/dvfd_emblem.png" alt="" />
            <span>
              Deshler
              <br />
              Fire &amp; Rescue
            </span>
          </a>
          <button
            className="menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Open menu"
          >
            ☰
          </button>
          <nav className={open ? "visible" : ""}>
            <a href="#about" onClick={() => setOpen(false)}>
              About
            </a>
            <a href="#services" onClick={() => setOpen(false)}>
              Services
            </a>
            <a href="#events" onClick={() => setOpen(false)}>
              Events
            </a>
            <a href="#join" onClick={() => setOpen(false)}>
              Join us
            </a>
            <a
              className="button"
              href="#contact"
              onClick={() => setOpen(false)}
            >
              Contact us
            </a>
          </nav>
        </div>
      </header>
      <main>
        <section className="hero" id="home">
          <div className="wrap hero-copy">
            <p className="eyebrow gold">
              Volunteer fire & rescue · Deshler, Nebraska
            </p>
            <h1>
              Ready to <em>serve.</em>
              <br />
              Built to respond.
            </h1>
            <p className="intro">
              Proudly protecting Deshler and our rural Nebraska neighbors with
              trained volunteers, trusted equipment, and a commitment that never
              clocks out.
            </p>
            <div className="actions">
              <a className="button" href="#join">
                Become a volunteer <span>→</span>
              </a>
              <a className="text-button" href="#about">
                Meet the department
              </a>
            </div>
          </div>
        </section>
        <section className="wrap stats" aria-label="Department statistics">
          <div>
            <b>24/7</b>
            <span>On call for you</span>
          </div>
          <div>
            <b>100%</b>
            <span>Volunteer led</span>
          </div>
          <div>
            <b>139</b>
            <span>Years of service</span>
          </div>
          <div>
            <b>1</b>
            <span>Strong community</span>
          </div>
        </section>
        <section className="section wrap intro-grid" id="about">
          <div>
            <p className="eyebrow">Your hometown department</p>
            <h2>
              Here when
              <br />
              the alarm sounds.
            </h2>
          </div>
          <p>
            From structure fires and medical emergencies to storm response and
            community education, our members bring professional skils when it
            matters most.
          </p>
        </section>
        <section className="wrap services" id="services">
          {services.map(([number, title, copy]) => (
            <article key={number}>
              <span className="service-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="section wrap events" id="events">
          <div>
            <p className="eyebrow">Community events</p>
            <h2>
              See you
              <br />
              around town.
            </h2>
          </div>
          <div className="event-panel">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
                rrulePlugin,
              ]}
              initialView="listWeek"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "today",
              }}
              height="auto"
              events={events}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                setSelectedEvent({
                  title: info.event.title,
                  details:
                    info.event.extendedProps.description ||
                    info.event.extendedProps.details,
                  location: info.event.extendedProps.location,
                });
              }}
            />
            <h3>Stay connected with the department.</h3>
            <p>
              Find open houses, fundraisers, training events, and community
              appearances on our events calendar.
            </p>
            <a className="text-link" href="/events">
              View upcoming events →
            </a>
          </div>
        </section>
        <section className="join" id="join">
          <div className="wrap">
            <p className="eyebrow gold">Make a difference locally</p>
            <h2>
              Answer the call
              <br />
              with us.
            </h2>
            <p>
              Training, gear, and a supportive team are provided. You only need
              a willingness to learn and serve.
            </p>
            <strong>Reach out to a member today to get an application!</strong>
          </div>
        </section>
        <section className="section wrap location">
          <div>
            <p className="eyebrow">Find the station</p>
            <h2>
              Stop by
              <br />
              and say hi.
            </h2>
            <address>
              <strong>Deshler Volunteer Fire & Rescue</strong>
              <br />
              404 E Pearl Ave
              <br />
              Deshler, NE 68340
            </address>
            <a
              className="text-link"
              target="_blank"
              rel="noreferrer"
              href="https://www.google.com/maps/dir/?api=1&destination=404+E+Pearl+Ave%2C+Deshler%2C+NE+68340"
            >
              Get directions →
            </a>
          </div>
          <iframe
            title="Map to Deshler Volunteer Fire and Rescue"
            src="https://www.google.com/maps?q=404%20E%20Pearl%20Ave%2C%20Deshler%2C%20NE%2068340&z=16&output=embed"
            loading="lazy"
          />
        </section>
      </main>
      <footer id="contact">
        <div className="wrap split">
          <div>
            <a className="brand" href="#home">
              <img className="brand-logo" src="/dvfd_emblem.png" alt="" />
              <span>
                Deshler
                <br />
                Fire &amp; Rescue
              </span>
            </a>
            <p>404 E Pearl Ave · Deshler, NE 68340</p>
          </div>
          <div>
            <p>
              <a className="phone-link" href="tel:+14023657750">
                <TelephoneFill aria-hidden="true" size={14} />
                <span>(402) 365-7750</span>
              </a>
            </p>
            <p>
              <a
                className="social-link"
                href="https://www.facebook.com/deshlervfd"
                target="_blank"
                rel="noreferrer"
              >
                <Facebook aria-hidden="true" size={15} />
                <span>Follow us on Facebook</span>
              </a>
            </p>
            <p>Emergency services: dial 911</p>
          </div>
        </div>
        <div className="wrap legal">
          © {new Date().getFullYear()} Deshler Volunteer Fire & Rescue
        </div>
      </footer>
      {selectedEvent && (
        <div
          className="event-modal-backdrop"
          onMouseDown={() => setSelectedEvent(null)}
        >
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
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details"
            >
              ×
            </button>
            <p className="event-label">Event details</p>
            <h2 id="event-modal-title">{selectedEvent.title}</h2>
            <div className="event-modal-content">
              <div>
                <p>
                  {selectedEvent.details || "More details will be shared soon."}
                </p>
                {selectedEvent.location && (
                  <p className="event-modal-location">
                    {selectedEvent.location}
                  </p>
                )}
              </div>
              {selectedEvent.location && (
                <div className="event-modal-map">
                  <iframe
                    title={`Map for ${selectedEvent.title}`}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&output=embed`}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.location)}`}
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
    </>
  );
}
const route = window.location.pathname;
const view =
  route === "/" || route === "/index.html" ? (
    <App />
  ) : route === "/events" ? (
    <EventsPage />
  ) : route === "/admin/login" ? (
    <AdminLogin />
  ) : route === "/admin/logout" ? (
    <AdminLogout />
  ) : route === "/admin/forgot-password" ? (
    <AdminForgotPassword />
  ) : route === "/admin/reset-password" ? (
    <AdminResetPassword />
  ) : route === "/admin/auth/callback" ? (
    <AdminAuthCallback />
  ) : route === "/admin/users" ? (
    <AdminGate>
      <AdminUsers />
    </AdminGate>
  ) : route === "/admin/events" ? (
    <AdminGate>
      <AdminEvents />
    </AdminGate>
  ) : route === "/401" ? (
    <ErrorPage code={401} />
  ) : route === "/403" ? (
    <ErrorPage code={403} />
  ) : route === "/404" ? (
    <ErrorPage code={404} />
  ) : (
    <ErrorPage code={404} />
  );
createRoot(document.getElementById("root")).render(view);
