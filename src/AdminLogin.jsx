import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AdminLogin() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) location.replace("/admin/events");
    });
  }, []);
  if (!supabase)
    return (
      <main className="admin">
        <h1>Supabase is not configured</h1>
      </main>
    );
  return (
    <main className="admin">
      <p className="eyebrow">Deshler Fire &amp; Rescue</p>
      <h1>Administrator sign in</h1>
      <p>Use your department account to manage events and users.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const { error } = await supabase.auth.signInWithPassword({
            email: data.get("email"),
            password: data.get("password"),
          });
          if (error) setMessage(error.message);
          else location.replace("/admin/events");
        }}
      >
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
      <p role="status">{message}</p>
      <p><a href="/admin/forgot-password">Forgot your password?</a></p>
    </main>
  );
}
