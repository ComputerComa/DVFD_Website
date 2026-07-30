import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AdminResetPassword() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setReady(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    if (password !== form.get("confirmPassword")) {
      setMessage("The passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password saved. Redirecting to sign in…");
    await supabase.auth.signOut();
    window.setTimeout(() => window.location.replace("/admin/login"), 1000);
  }

  if (!supabase)
    return <main className="admin"><h1>Supabase is not configured</h1></main>;

  return (
    <main className="admin">
      <p className="eyebrow">Deshler Fire &amp; Rescue</p>
      <h1>Choose a new password</h1>
      {ready ? (
        <form onSubmit={submit}>
          <label>
            New password
            <input name="password" type="password" minLength="12" required autoComplete="new-password" />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" minLength="12" required autoComplete="new-password" />
          </label>
          <button>Save password</button>
        </form>
      ) : (
        <p>Open this page from a valid invitation or password reset email.</p>
      )}
      <p role="status">{message}</p>
    </main>
  );
}
