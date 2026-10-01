<script setup lang="ts">
definePageMeta({ layout: "admin-auth" })
const supabase = useSupabaseClient()
const email = ref("")
const message = ref("")
const loading = ref(false)

async function submit() {
  loading.value = true
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/admin/reset-password`,
  })
  loading.value = false
  message.value = error
    ? error.message
    : "If that address is registered, a password reset link has been sent."
}
</script>

<template>
  <section class="admin-auth-card">
    <p class="eyebrow">Deshler Fire &amp; Rescue</p>
    <h1>Reset your password</h1>
    <p>Enter your department email address to receive a reset link.</p>
    <form @submit.prevent="submit">
      <label class="admin-field"><span>Email</span><UInput v-model="email" type="email" autocomplete="email" required size="xl" /></label>
      <UButton type="submit" size="xl" block :loading="loading" label="Send reset link" />
    </form>
    <UAlert v-if="message" class="admin-status" :description="message" />
    <p><NuxtLink to="/admin/login">Return to sign in</NuxtLink></p>
  </section>
</template>
