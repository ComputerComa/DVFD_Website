import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import ErrorPage from "./ErrorPage";

export default function AdminGate({ children }) {
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState("Checking administrator access…");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    if (!supabase) {
      setState("denied");
      setMessage("Supabase is not configured.");
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setState("unauthenticated");
        setMessage("Sign in with an administrator account to continue.");
        return;
      }
      const { data: role, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (error) {
        setState("forbidden");
        setMessage(error.message);
        return;
      }
      if (!role) {
        setState("forbidden");
        setMessage("You do not have administrator access.");
        return;
      }
      setState("allowed");
    });
  }, []);
  if (state === "allowed") return children;
  if (state === "checking")
    return (
      <main className="admin">
        <h1>Checking access</h1>
        <p>{message}</p>
      </main>
    );
  if (state === "unauthenticated")
    return (
      <ErrorPage
        code={401}
        onSignIn={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setState("checking");
          const { error } = await supabase.auth.signInWithPassword({
            email: data.get("email"),
            password: data.get("password"),
          });
          if (error) {
            setState("unauthenticated");
            setMessage(error.message);
          } else location.reload();
        }}
      />
    );
  return <ErrorPage code={403} detail={message} />;
}
