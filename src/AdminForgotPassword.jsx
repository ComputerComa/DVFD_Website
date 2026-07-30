import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function AdminForgotPassword() {
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setMessage(
      error
        ? error.message
        : "If that address is registered, a password reset link has been sent.",
    );
  }

  if (!supabase)
    return <main className="admin"><h1>Supabase is not configured</h1></main>;

  return (
    <main className="admin">
      <p className="eyebrow">Deshler Fire &amp; Rescue</p>
      <h1>Reset your password</h1>
      <p>Enter your department email address to receive a reset link.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <button>Send reset link</button>
      </form>
      <p role="status">{message}</p>
      <p><a href="/admin/login">Return to sign in</a></p>
    </main>
  );
}
