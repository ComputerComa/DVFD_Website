import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
export default function AdminUsers() {
  const [users, setUsers] = useState([]),
    [email, setEmail] = useState(""),
    [isAdmin, setIsAdmin] = useState(false),
    [message, setMessage] = useState("");
  const call = async (action, body = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action, ...body },
    });
    if (error || data?.error) throw new Error(data?.error || error.message);
    return data;
  };
  const load = async () => {
    try {
      setUsers((await call("list")).users);
    } catch (e) {
      setMessage(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const invite = async (e) => {
    e.preventDefault();
    try {
      setMessage(
        (
          await call("invite", {
            email,
            isAdmin,
            redirectTo: `${location.origin}/admin/reset-password`,
          })
        ).message,
      );
      setEmail("");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <main className="admin">
      <header>
        <div>
          <p className="eyebrow">Department administration</p>
          <h1>User management</h1>
        </div>
        <a href="/admin/events">Manage events</a>
      </header>
      <form onSubmit={invite}>
        <label>
          Email address
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Make this user an administrator
        </label>
        <button>Send invitation</button>
      </form>
      <p role="status">{message}</p>
      <section className="admin-list">
        {users.map((user) => (
          <article key={user.id}>
            <div>
              <strong>{user.email}</strong>
              <br />
              <small>
                {user.isAdmin ? "Administrator · " : ""}
                {user.confirmed ? "Verified" : "Invitation pending"}
              </small>
            </div>
            <button
              onClick={async () => {
                try {
                  setMessage(
                    (
                      await call("set-admin", {
                        userId: user.id,
                        isAdmin: !user.isAdmin,
                      })
                    ).message,
                  );
                  load();
                } catch (e) {
                  setMessage(e.message);
                }
              }}
            >
              {user.isAdmin ? "Remove admin" : "Make admin"}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
