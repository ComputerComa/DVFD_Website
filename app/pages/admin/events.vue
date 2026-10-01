<script setup lang="ts">
import type { EventRow, SiteBanner } from "~/types/domain"
import {
  emptyRecurrence,
  generateRRule,
  matchesMonthlyOrdinal,
  parseRecurrence,
} from "~/utils/recurrence"
import { toLocalDateTime } from "~/utils/events"

definePageMeta({ layout: "admin", middleware: "admin" })
useSeoMeta({ title: "Manage Events | DVFD Administration" })

interface EventForm {
  title: string
  start_at: string
  end_at: string
  location: string
  description: string
  banner_message: string
  published: boolean
}

const createEmptyForm = (): EventForm => ({
  title: "",
  start_at: "",
  end_at: "",
  location: "",
  description: "",
  banner_message: "",
  published: true,
})
const createEmptyBanner = () => ({
  id: 1,
  message: "",
  enabled: false,
  starts_at: "",
  ends_at: "",
})

const supabase = useSupabaseClient()
const events = ref<EventRow[]>([])
const form = reactive(createEmptyForm())
const recurrence = ref(emptyRecurrence())
const editing = ref<string | null>(null)
const banner = reactive(createEmptyBanner())
const message = ref("")
const messageColor = ref<"success" | "error">("success")
const loading = ref(false)
const deleteTarget = ref<EventRow | null>(null)

function report(copy: string, isError = false) {
  message.value = copy
  messageColor.value = isError ? "error" : "success"
}

async function load() {
  loading.value = true
  const [eventsResult, bannerResult] = await Promise.all([
    supabase.from("events").select("*").order("start_at"),
    supabase.from("site_banners").select("*").eq("id", 1).maybeSingle(),
  ])
  loading.value = false
  if (eventsResult.error) report(eventsResult.error.message, true)
  else events.value = (eventsResult.data || []) as EventRow[]
  if (bannerResult.error) report(bannerResult.error.message, true)
  else if (bannerResult.data) {
    const value = bannerResult.data as SiteBanner
    Object.assign(banner, {
      ...value,
      starts_at: toLocalDateTime(value.starts_at),
      ends_at: toLocalDateTime(value.ends_at),
    })
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  recurrence.value = emptyRecurrence()
  editing.value = null
}

async function saveEvent() {
  if (form.banner_message.trim() && !form.end_at) {
    report("An event banner requires an end time so it can turn off automatically.", true)
    return
  }
  if (!matchesMonthlyOrdinal(form.start_at, recurrence.value)) {
    report("The start date must fall on the selected monthly weekday.", true)
    return
  }
  loading.value = true
  const payload = {
    ...form,
    start_at: new Date(form.start_at).toISOString(),
    end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    rrule: generateRRule(form.start_at, recurrence.value),
  }
  const query = editing.value
    ? supabase.from("events").update(payload).eq("id", editing.value)
    : supabase.from("events").insert(payload)
  const { error } = await query
  loading.value = false
  if (error) report(error.message, true)
  else {
    report(editing.value ? "Event updated." : "Event added.")
    resetForm()
    await load()
  }
}

function editEvent(event: EventRow) {
  editing.value = event.id
  Object.assign(form, {
    title: event.title,
    start_at: toLocalDateTime(event.start_at),
    end_at: toLocalDateTime(event.end_at),
    location: event.location || "",
    description: event.description || "",
    banner_message: event.banner_message || "",
    published: event.published,
  })
  recurrence.value = parseRecurrence(event.rrule)
  window.scrollTo({ top: 0, behavior: "smooth" })
}

async function removeEvent() {
  if (!deleteTarget.value) return
  const { error } = await supabase.from("events").delete().eq("id", deleteTarget.value.id)
  if (error) report(error.message, true)
  else {
    report("Event deleted.")
    deleteTarget.value = null
    await load()
  }
}

async function saveBanner() {
  if (banner.starts_at && banner.ends_at && banner.ends_at <= banner.starts_at) {
    report("The banner end must be later than its start time.", true)
    return
  }
  loading.value = true
  const { data, error } = await supabase
    .from("site_banners")
    .update({
      message: banner.message.trim(),
      enabled: banner.enabled && Boolean(banner.message.trim()),
      starts_at: banner.starts_at ? new Date(banner.starts_at).toISOString() : null,
      ends_at: banner.ends_at ? new Date(banner.ends_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select()
    .single()
  loading.value = false
  if (error) report(error.message, true)
  else {
    report("Site banner saved.")
    Object.assign(banner, {
      ...data,
      starts_at: toLocalDateTime(data.starts_at),
      ends_at: toLocalDateTime(data.ends_at),
    })
  }
}

await load()
</script>

<template>
  <header class="admin-topbar">
    <div>
      <p class="admin-kicker">Department administration</p>
      <h1>Events &amp; notices</h1>
    </div>
    <UBadge variant="soft" :label="`${events.length} event${events.length === 1 ? '' : 's'}`" />
  </header>

  <UAlert
    v-if="message"
    class="admin-status"
    :color="messageColor"
    :description="message"
    :icon="messageColor === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'"
    close
    @update:open="message = ''"
  />

  <section class="admin-panel admin-panel-accent" aria-labelledby="banner-title">
    <p class="admin-kicker">Site-wide announcement</p>
    <h2 id="banner-title">Scrolling banner</h2>
    <form class="admin-form-grid" @submit.prevent="saveBanner">
      <label class="admin-field full"><span>Message</span><UTextarea v-model="banner.message" :rows="3" maxlength="500" placeholder="Example: Burn ban remains in effect until further notice." /></label>
      <label class="admin-field"><span>Start date &amp; time (optional)</span><UInput v-model="banner.starts_at" type="datetime-local" /></label>
      <label class="admin-field"><span>End date &amp; time (optional)</span><UInput v-model="banner.ends_at" type="datetime-local" /></label>
      <div class="admin-actions full">
        <UCheckbox v-model="banner.enabled" label="Display this banner on the website" />
        <UButton type="submit" icon="i-lucide-save" label="Save banner" :loading="loading" />
      </div>
    </form>
  </section>

  <section class="admin-panel" aria-labelledby="event-form-title">
    <p class="admin-kicker">Calendar</p>
    <h2 id="event-form-title">{{ editing ? "Edit event" : "Add an event" }}</h2>
    <form class="admin-form-grid" @submit.prevent="saveEvent">
      <label class="admin-field full"><span>Event title</span><UInput v-model="form.title" required /></label>
      <label class="admin-field"><span>Start</span><UInput v-model="form.start_at" type="datetime-local" required /></label>
      <label class="admin-field"><span>End</span><UInput v-model="form.end_at" type="datetime-local" /></label>
      <label class="admin-field full"><span>Location</span><UInput v-model="form.location" icon="i-lucide-map-pin" /></label>
      <RecurrenceBuilder v-model="recurrence" :start="form.start_at" />
      <label class="admin-field full"><span>Description</span><UTextarea v-model="form.description" :rows="4" /></label>
      <label class="admin-field full"><span>Scrolling banner message (optional)</span><UTextarea v-model="form.banner_message" :rows="3" maxlength="500" placeholder="Shown only while this event is in progress." /><small class="admin-help">An end time is required when using an event banner.</small></label>
      <div class="admin-actions full">
        <UCheckbox v-model="form.published" label="Published" />
        <UButton type="submit" icon="i-lucide-save" :label="editing ? 'Save changes' : 'Add event'" :loading="loading" />
        <UButton v-if="editing" type="button" color="neutral" variant="outline" label="Cancel" @click="resetForm" />
      </div>
    </form>
  </section>

  <section aria-labelledby="event-list-title">
    <div class="admin-topbar">
      <div><p class="admin-kicker">Schedule</p><h2 id="event-list-title">All events</h2></div>
      <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" label="Refresh" :loading="loading" @click="load" />
    </div>
    <div class="admin-list">
      <div v-if="!events.length" class="admin-empty">No events have been created.</div>
      <article v-for="event in events" v-else :key="event.id" class="admin-list-row">
        <div><strong>{{ event.title }}</strong><small>{{ new Date(event.start_at).toLocaleString() }}<template v-if="event.rrule"> · recurring</template><template v-if="!event.published"> · draft</template></small></div>
        <div class="admin-list-actions">
          <UButton color="neutral" variant="outline" icon="i-lucide-pencil" label="Edit" @click="editEvent(event)" />
          <UButton color="error" variant="soft" icon="i-lucide-trash-2" label="Delete" @click="deleteTarget = event" />
        </div>
      </article>
    </div>
  </section>

  <UModal :open="Boolean(deleteTarget)" title="Delete this event?" :description="deleteTarget ? `${deleteTarget.title} will be permanently removed.` : ''" @update:open="!$event && (deleteTarget = null)">
    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="deleteTarget = null" />
      <UButton color="error" icon="i-lucide-trash-2" label="Delete event" @click="removeEvent" />
    </template>
  </UModal>
</template>
