<script setup lang="ts">
definePageMeta({ layout: "admin-auth" })
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const password = ref("")
const confirmPassword = ref("")
const message = ref("")
const loading = ref(false)

async function submit() {
  if (password.value !== confirmPassword.value) {
    message.value = "The passwords do not match."
    return
  }
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: password.value })
  if (error) {
    loading.value = false
    message.value = error.message
    return
  }
  message.value = "Password saved. Redirecting to sign in…"
  await supabase.auth.signOut()
  await navigateTo("/admin/login")
}
</script>

<template>
  <section class="admin-auth-card">
    <p class="eyebrow">Deshler Fire &amp; Rescue</p>
    <h1>Choose a new password</h1>
    <form v-if="user" @submit.prevent="submit">
      <label class="admin-field"><span>New password</span><UInput v-model="password" type="password" minlength="12" autocomplete="new-password" required size="xl" /></label>
      <label class="admin-field"><span>Confirm password</span><UInput v-model="confirmPassword" type="password" minlength="12" autocomplete="new-password" required size="xl" /></label>
      <UButton type="submit" size="xl" block :loading="loading" label="Save password" />
    </form>
    <p v-else>Open this page from a valid invitation or password reset email.</p>
    <UAlert v-if="message" class="admin-status" :description="message" />
  </section>
</template>
