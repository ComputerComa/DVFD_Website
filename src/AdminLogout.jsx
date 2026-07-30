import { useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function AdminLogout() {
  useEffect(() => {
    supabase?.auth.signOut().finally(() => location.replace("/admin/login"));
  }, []);
  return (
    <main className="admin">
      <h1>Signing out…</h1>
    </main>
  );
}
