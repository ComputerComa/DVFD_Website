import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import RecurrenceBuilder, {
  emptyRecurrence,
  generateRRule,
  parseRecurrence,
} from "./RecurrenceBuilder";
const empty = {
  title: "",
  start_at: "",
  end_at: "",
  location: "",
  description: "",
  banner_message: "",
  published: true,
};
const weekdayNumbers = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};
function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function matchesMonthlyOrdinal(start, recurrence) {
  if (
    recurrence.frequency !== "monthly" ||
    !recurrence.monthlyOrdinal ||
    !recurrence.monthlyWeekday
  )
    return true;

  const date = new Date(start);
  if (date.getDay() !== weekdayNumbers[recurrence.monthlyWeekday]) return false;

  const isLast = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7)
    .getMonth() !== date.getMonth();
  return recurrence.monthlyOrdinal === "-1"
    ? isLast
    : Math.ceil(date.getDate() / 7) === Number(recurrence.monthlyOrdinal);
}
export default function AdminEvents() {
  const [session, setSession] = useState(null),
    [events, setEvents] = useState([]),
    [form, setForm] = useState(empty),
    [recurrence, setRecurrence] = useState(emptyRecurrence),
    [editing, setEditing] = useState(null),
    [banner, setBanner] = useState({
      id: 1,
      message: "",
      enabled: false,
      starts_at: "",
      ends_at: "",
    }),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session) load();
  }, [session]);
  async function load() {
    const [eventsResult, bannerResult] = await Promise.all([
      supabase.from("events").select("*").order("start_at"),
      supabase.from("site_banners").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (eventsResult.error) setMessage(eventsResult.error.message);
    else setEvents(eventsResult.data);
    if (bannerResult.error) setMessage(bannerResult.error.message);
    else if (bannerResult.data)
      setBanner({
        ...bannerResult.data,
        starts_at: toLocalDateTime(bannerResult.data.starts_at),
        ends_at: toLocalDateTime(bannerResult.data.ends_at),
      });
  }
  async function signIn(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: d.get("email"),
      password: d.get("password"),
    });
    setMessage(error?.message || "Signed in.");
  }
  async function save(e) {
    e.preventDefault();
    if (form.banner_message.trim() && !form.end_at) {
      setMessage("An event banner requires an end time so it can turn off automatically.");
      return;
    }
    if (!matchesMonthlyOrdinal(form.start_at, recurrence)) {
      setMessage(
        "The start date must fall on the selected monthly weekday (for example, the fourth Thursday).",
      );
      return;
    }
    const payload = {
      ...form,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      rrule: generateRRule(form.start_at, recurrence),
    };
    const q = editing
      ? supabase.from("events").update(payload).eq("id", editing)
      : supabase.from("events").insert(payload);
    const { error } = await q;
    setMessage(error?.message || (editing ? "Event updated." : "Event added."));
    if (!error) {
      setForm(empty);
      setRecurrence(emptyRecurrence);
      setEditing(null);
      load();
    }
  }
  async function remove(id) {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    setMessage(error?.message || "Event deleted.");
    load();
  }
  async function saveBanner(e) {
    e.preventDefault();
    if (banner.starts_at && banner.ends_at && banner.ends_at <= banner.starts_at) {
      setMessage("The banner end must be later than its start time.");
      return;
    }
    const { data, error } = await supabase
      .from("site_banners")
      .update({
        message: banner.message.trim(),
        enabled: banner.enabled && Boolean(banner.message.trim()),
        starts_at: banner.starts_at ? new Date(banner.starts_at).toISOString() : null,
        ends_at: banner.ends_at ? new Date(banner.ends_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();
    setMessage(error?.message || "Site banner saved.");
    if (data)
      setBanner({
        ...data,
        starts_at: toLocalDateTime(data.starts_at),
        ends_at: toLocalDateTime(data.ends_at),
      });
  }
  if (!supabase)
    return (
      <main className="admin">
        <h1>Configure Supabase first</h1>
      </main>
    );
  if (!session)
    return (
      <main className="admin">
        <h1>Events administrator</h1>
        <form onSubmit={signIn}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button>Sign in</button>
        </form>
        <p>{message}</p>
      </main>
    );
  return (
    <main className="admin">
      <header>
        <h1>Manage events</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <section className="banner-settings" aria-labelledby="banner-settings-title">
        <p className="event-label">Site-wide announcement</p>
        <h2 id="banner-settings-title">Scrolling banner</h2>
        <form className="banner-form" onSubmit={saveBanner}>
          <label>
            Message
            <textarea
              maxLength="500"
              value={banner.message}
              onChange={(e) => setBanner({ ...banner, message: e.target.value })}
              placeholder="Example: Burn ban remains in effect until further notice."
            />
          </label>
          <label className="banner-toggle">
            <input
              type="checkbox"
              checked={banner.enabled}
              onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })}
            />
            Display this banner on the website
          </label>
          <label>
            Start date &amp; time (optional)
            <input
              type="datetime-local"
              value={banner.starts_at}
              onChange={(e) => setBanner({ ...banner, starts_at: e.target.value })}
            />
          </label>
          <label>
            End date &amp; time (optional)
            <input
              type="datetime-local"
              value={banner.ends_at}
              onChange={(e) => setBanner({ ...banner, ends_at: e.target.value })}
            />
          </label>
          <button>Save banner</button>
        </form>
      </section>
      <form className="event-form" onSubmit={save}>
        <label>
          Event title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Start
          <input
            required
            type="datetime-local"
            value={form.start_at}
            onChange={(e) => setForm({ ...form, start_at: e.target.value })}
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={form.end_at}
            onChange={(e) => setForm({ ...form, end_at: e.target.value })}
          />
        </label>
        <label>
          Location
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <RecurrenceBuilder
          value={recurrence}
          onChange={setRecurrence}
          start={form.start_at}
        />
        <label className="full">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="full">
          Scrolling banner message (optional)
          <textarea
            maxLength="500"
            value={form.banner_message}
            onChange={(e) => setForm({ ...form, banner_message: e.target.value })}
            placeholder="Shown in the site banner only while this event is in progress."
          />
          <small>An end time is required when using an event banner.</small>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />{" "}
          Published
        </label>
        <button>{editing ? "Save changes" : "Add event"}</button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setRecurrence(emptyRecurrence);
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <p>{message}</p>
      <section className="admin-list">
        {events.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <br />
              <small>
                {new Date(item.start_at).toLocaleString()}
                {item.rrule ? " · recurring" : ""}
              </small>
            </div>
            <div>
              <button
                onClick={() => {
                  setEditing(item.id);
                  setForm({
                    ...item,
                    start_at: item.start_at.slice(0, 16),
                    end_at: item.end_at?.slice(0, 16) || "",
                    banner_message: item.banner_message || "",
                  });
                  setRecurrence(parseRecurrence(item.rrule));
                }}
              >
                Edit
              </button>
              <button onClick={() => remove(item.id)}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
