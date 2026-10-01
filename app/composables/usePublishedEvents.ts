import type { EventRow } from "~/types/domain"

export function usePublishedEvents(key = "published-events") {
  const supabase = useSupabaseClient()
  return useAsyncData(
    key,
    async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("start_at")
      if (error) throw error
      return (data || []) as EventRow[]
    },
    { default: () => [] },
  )
}
