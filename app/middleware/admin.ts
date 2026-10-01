export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  const userId = user.value?.sub
  if (!userId) {
    return navigateTo("/admin/login")
  }

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return navigateTo({ path: "/403", query: error ? { detail: error.message } : undefined })
  }
})
