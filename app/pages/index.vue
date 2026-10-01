<script setup lang="ts">
import { rrulestr } from "rrule"
import type { EventRow, SiteBanner } from "~/types/domain"

const services = [
  ["01", "Fire response", "Rapid response for home, business, vehicle, grass, and rural fire incidents."],
  ["02", "Rescue & EMS", "Compassionate emergency medical care and rescue support when every second counts."],
  ["03", "Storm response", "Prepared for severe weather, accidents, and the unexpected across our community."],
]

const supabase = useSupabaseClient()
const menuOpen = ref(false)
const now = ref(new Date())
const { data: events } = await usePublishedEvents("home-published-events")
const { data: banner, refresh: refreshBanner } = await useAsyncData(
  "active-site-banner",
  async () => {
    const { data, error } = await supabase
      .from("site_banners")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
    if (error) throw error
    return data as SiteBanner | null
  },
)
const { data: alertResponse } = await useFetch<{ alerts: string[] }>("/api/alerts", {
  default: () => ({ alerts: [] }),
})

function eventBannerIsActive(event: EventRow, clock: Date) {
  if (!event.banner_message || !event.end_at) return false
  const end = new Date(event.end_at)
  const duration = end.getTime() - new Date(event.start_at).getTime()
  if (duration <= 0) return false
  if (!event.rrule) {
    const start = new Date(event.start_at)
    return clock >= start && clock < end
  }
  try {
    const occurrence = rrulestr(event.rrule).before(clock, true)
    return Boolean(
      occurrence &&
        clock >= occurrence &&
        clock < new Date(occurrence.getTime() + duration),
    )
  } catch {
    return false
  }
}

const bannerMessages = computed(() => {
  const clock = now.value
  const manualActive =
    banner.value?.enabled &&
    banner.value.message &&
    (!banner.value.starts_at || new Date(banner.value.starts_at) <= clock) &&
    (!banner.value.ends_at || new Date(banner.value.ends_at) > clock)
  return [
    ...(manualActive ? [banner.value!.message] : []),
    ...(alertResponse.value?.alerts || []),
    ...(events.value || [])
      .filter((event) => eventBannerIsActive(event, clock))
      .map((event) => event.banner_message as string),
  ]
})

let timer: number | undefined
let channel: ReturnType<typeof supabase.channel> | undefined
onMounted(() => {
  timer = window.setInterval(() => (now.value = new Date()), 60_000)
  channel = supabase
    .channel("public-site-banner")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_banners", filter: "id=eq.1" },
      () => refreshBanner(),
    )
    .subscribe()
})
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  if (channel) supabase.removeChannel(channel)
})

useSeoMeta({
  title: "Deshler Fire & Rescue",
  description:
    "Volunteer fire and rescue serving Deshler, Nebraska and the surrounding community.",
})
</script>

<template>
  <header>
    <div class="wrap nav">
      <SiteBrand />
      <button
        class="menu"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="site-navigation"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <UIcon name="i-lucide-menu" />
      </button>
      <nav id="site-navigation" :class="{ visible: menuOpen }">
        <a href="#about" @click="menuOpen = false">About</a>
        <a href="#services" @click="menuOpen = false">Services</a>
        <a href="#events" @click="menuOpen = false">Events</a>
        <a href="#join" @click="menuOpen = false">Join us</a>
        <a class="button" href="#contact" @click="menuOpen = false">Contact us</a>
      </nav>
    </div>
  </header>

  <aside v-if="bannerMessages.length" class="site-banner" aria-live="polite">
    <span class="sr-only">Current notices:</span>
    <div class="site-banner-track">
      <span>{{ bannerMessages.join("  •  ") }}</span>
      <span aria-hidden="true">{{ bannerMessages.join("  •  ") }}</span>
    </div>
  </aside>

  <main>
    <section id="home" class="hero">
      <div class="wrap hero-copy">
        <p class="eyebrow gold">Volunteer fire &amp; rescue · Deshler, Nebraska</p>
        <h1>Ready to <em>serve.</em><br />Built to respond.</h1>
        <p class="intro">
          Proudly protecting Deshler and our rural Nebraska neighbors with trained
          volunteers, trusted equipment, and a commitment that never clocks out.
        </p>
        <div class="actions">
          <a class="button" href="#join">Become a volunteer <span>→</span></a>
          <a class="text-button" href="#about">Meet the department</a>
        </div>
      </div>
    </section>

    <section class="wrap stats" aria-label="Department statistics">
      <div><b>24/7</b><span>On call for you</span></div>
      <div><b>100%</b><span>Volunteer led</span></div>
      <div><b>139</b><span>Years of service</span></div>
      <div><b>1</b><span>Strong community</span></div>
    </section>

    <section id="about" class="section wrap intro-grid">
      <div>
        <p class="eyebrow">Your hometown department</p>
        <h2>Here when<br />the alarm sounds.</h2>
      </div>
      <p>
        From structure fires and medical emergencies to storm response and community
        education, our members bring professional skills when it matters most.
      </p>
    </section>

    <section id="services" class="wrap services">
      <article v-for="service in services" :key="service[0]">
        <span class="service-number">{{ service[0] }}</span>
        <h3>{{ service[1] }}</h3>
        <p>{{ service[2] }}</p>
      </article>
    </section>

    <section id="events" class="section wrap events">
      <div>
        <p class="eyebrow">Community events</p>
        <h2>See you<br />around town.</h2>
      </div>
      <div class="event-panel">
        <ClientOnly>
          <EventCalendar :events="events || []" compact />
          <template #fallback><p>Loading community calendar…</p></template>
        </ClientOnly>
        <h3>Stay connected with the department.</h3>
        <p>Find open houses, fundraisers, training events, and community appearances on our events calendar.</p>
        <NuxtLink class="text-link" to="/events">View upcoming events →</NuxtLink>
      </div>
    </section>

    <section id="join" class="join">
      <div class="wrap">
        <p class="eyebrow gold">Make a difference locally</p>
        <h2>Answer the call<br />with us.</h2>
        <p>Training, gear, and a supportive team are provided. You only need a willingness to learn and serve.</p>
        <strong>Reach out to a member today to get an application!</strong>
      </div>
    </section>

    <section class="section wrap location">
      <div>
        <p class="eyebrow">Find the station</p>
        <h2>Stop by<br />and say hi.</h2>
        <address><strong>Deshler Volunteer Fire &amp; Rescue</strong><br />404 E Pearl Ave<br />Deshler, NE 68340</address>
        <a class="text-link" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=404+E+Pearl+Ave%2C+Deshler%2C+NE+68340">Get directions →</a>
      </div>
      <iframe title="Map to Deshler Volunteer Fire and Rescue" src="https://www.google.com/maps?q=404%20E%20Pearl%20Ave%2C%20Deshler%2C%20NE%2068340&z=16&output=embed" loading="lazy" />
    </section>
  </main>

  <footer id="contact">
    <div class="wrap split">
      <div>
        <SiteBrand />
        <p>404 E Pearl Ave · Deshler, NE 68340</p>
      </div>
      <div>
        <p><a class="phone-link" href="tel:+14023657750"><UIcon name="i-lucide-phone" /><span>(402) 365-7750</span></a></p>
        <p><a class="social-link" href="https://www.facebook.com/deshlervfd" target="_blank" rel="noreferrer"><UIcon name="i-lucide-facebook" /><span>Follow us on Facebook</span></a></p>
        <p><a class="social-link" href="https://webmail.dvfdne.org" target="_blank" rel="noreferrer"><UIcon name="i-lucide-mail" /><span>Member Webmail</span></a></p>
        <p>Emergency services: dial 911</p>
      </div>
    </div>
    <div class="wrap legal">© {{ new Date().getFullYear() }} Deshler Volunteer Fire &amp; Rescue</div>
  </footer>
</template>
