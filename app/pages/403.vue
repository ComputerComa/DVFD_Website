<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <main class="error-page">
    <div class="error-rail">
      <SiteBrand />
      <p>Emergency? Call <a href="tel:911">911</a></p>
    </div>
    <section class="error-content">
      <p class="eyebrow gold">Access restricted</p>
      <div class="error-code" aria-hidden="true">403</div>
      <h1>You are not cleared for this page.</h1>
      <p>{{ route.query.detail || "Your account is signed in, but it does not have permission to access this area." }}</p>
      <NuxtLink class="button" to="/">Return home →</NuxtLink>
    </section>
  </main>
</template>
