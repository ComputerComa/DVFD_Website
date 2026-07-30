import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return reply({ error: "Sign in is required." }, 401);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user) return reply({ error: "Session is invalid." }, 401);
  const { data: role, error: roleError } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleError) return reply({ error: roleError.message }, 500);
  if (!role) return reply({ error: "Administrator access is required." }, 403);
  const body = await req.json();
  if (body.action === "me") return reply({ isAdmin: true });
  if (body.action === "list") {
    const [{ data: auth, error }, { data: roles }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("admins").select("user_id"),
    ]);
    if (error) return reply({ error: error.message }, 400);
    const ids = new Set((roles ?? []).map((r) => r.user_id));
    return reply({
      users: auth.users.map((u) => ({
        id: u.id,
        email: u.email,
        confirmed: !!u.email_confirmed_at,
        createdAt: u.created_at,
        isAdmin: ids.has(u.id),
      })),
    });
  }
  if (body.action === "invite") {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      body.email,
      { redirectTo: body.redirectTo },
    );
    if (error) return reply({ error: error.message }, 400);
    if (body.isAdmin && data.user)
      await admin.from("admins").insert({ user_id: data.user.id });
    return reply({ message: `Invitation sent to ${body.email}.` });
  }
  if (body.action === "set-admin") {
    if (body.userId === user.id)
      return reply(
        { error: "You cannot remove your own administrator access." },
        400,
      );
    const { error } = body.isAdmin
      ? await admin.from("admins").upsert({ user_id: body.userId })
      : await admin.from("admins").delete().eq("user_id", body.userId);
    return error
      ? reply({ error: error.message }, 400)
      : reply({ message: "Administrator access updated." });
  }
  return reply({ error: "Unknown request." }, 400);
});
