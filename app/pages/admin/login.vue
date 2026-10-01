<script setup lang="ts">
definePageMeta({ layout: "admin-auth" })
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref("")
const password = ref("")
const message = ref("")
const loading = ref(false)

if (user.value) await navigateTo("/admin/events")

async function signIn() {
  loading.value = true
  message.value = ""
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (error) message.value = error.message
  else await navigateTo("/admin/events")
}

useSeoMeta({ title: "Administrator Sign In | Deshler Fire & Rescue" })
</script>

<template>
  <section class="admin-auth-card">
    <SiteBrand compact />
    <p class="eyebrow">Department administration</p>
    <h1>Administrator sign in</h1>
    <p>Use your department account to manage events, notices, and users.</p>
    <form @submit.prevent="signIn">
      <label class="admin-field"><span>Email</span><UInput v-model="email" type="email" autocomplete="email" required size="xl" /></label>
      <label class="admin-field"><span>Password</span><UInput v-model="password" type="password" autocomplete="current-password" required size="xl" /></label>
      <UButton type="submit" size="xl" block :loading="loading" label="Sign in" />
    </form>
    <UAlert v-if="message" class="admin-status" color="error" :description="message" />
    <p><NuxtLink to="/admin/forgot-password">Forgot your password?</NuxtLink></p>
    <p><NuxtLink to="/">Return to the public site</NuxtLink></p>
  </section>
</template>
