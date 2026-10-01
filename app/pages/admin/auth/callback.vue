<script setup lang="ts">
definePageMeta({ layout: "admin-auth" })
const user = useSupabaseUser()
const message = ref("Confirming your account…")
const route = useRoute()

if (route.query.error_description) {
  message.value = String(route.query.error_description).replaceAll("+", " ")
}

watch(
  user,
  async (value) => {
    if (value) await navigateTo("/admin/events")
  },
  { immediate: true },
)
</script>

<template>
  <section class="admin-auth-card">
    <p class="eyebrow">Deshler Fire &amp; Rescue</p>
    <h1>Account confirmation</h1>
    <p role="status">{{ message }}</p>
    <p><NuxtLink to="/admin/login">Go to sign in</NuxtLink></p>
  </section>
</template>
