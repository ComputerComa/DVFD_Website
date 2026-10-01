<script setup lang="ts">
const { data: events, error } = await usePublishedEvents("events-page")
useSeoMeta({
  title: "Upcoming Events | Deshler Fire & Rescue",
  description: "Community events and department activities from Deshler Fire & Rescue.",
})
</script>

<template>
  <main class="events-page">
    <header class="events-header">
      <SiteBrand />
      <NuxtLink class="button" to="/">Return home</NuxtLink>
    </header>
    <section class="events-calendar">
      <p class="eyebrow">Community calendar</p>
      <h1>Upcoming events</h1>
      <UAlert v-if="error" color="error" title="Calendar unavailable" description="Please try again shortly." />
      <ClientOnly v-else>
        <EventCalendar :events="events || []" />
        <template #fallback><p>Loading community calendar…</p></template>
      </ClientOnly>
    </section>
  </main>
</template>
