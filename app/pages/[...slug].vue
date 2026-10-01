<script setup lang="ts">
setResponseStatus(404)
useSeoMeta({ title: "Page Not Found | Deshler Fire & Rescue" })
</script>

<template>
  <main class="error-page">
    <div class="error-rail"><SiteBrand /><p>Emergency? Call <a href="tel:911">911</a></p></div>
    <section class="error-content">
      <p class="eyebrow gold">Page not found</p>
      <div class="error-code" aria-hidden="true">404</div>
      <h1>This route has gone dark.</h1>
      <p>The page may have moved, been removed, or never existed.</p>
      <NuxtLink class="button" to="/">Return home →</NuxtLink>
    </section>
  </main>
</template>
