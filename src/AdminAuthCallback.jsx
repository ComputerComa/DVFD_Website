import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AdminAuthCallback() {
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const error = hash.get("error_description");
    if (error) {
      setMessage(error.replaceAll("+", " "));
      return;
    }
    if (!supabase) return;

    const finish = (session) => {
      if (session) window.location.replace("/admin/events");
      else setMessage("Confirmation completed. You can now sign in.");
    };
    supabase.auth.getSession().then(({ data }) => finish(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => finish(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="admin">
      <p className="eyebrow">Deshler Fire &amp; Rescue</p>
      <h1>Account confirmation</h1>
      <p role="status">{message}</p>
      <p><a href="/admin/login">Go to sign in</a></p>
    </main>
  );
}
