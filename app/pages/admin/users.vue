<script setup lang="ts">
import type { AdminUser } from "~/types/domain"

definePageMeta({ layout: "admin", middleware: "admin" })
useSeoMeta({ title: "Manage Users | DVFD Administration" })

const supabase = useSupabaseClient()
const users = ref<AdminUser[]>([])
const email = ref("")
const isAdmin = ref(false)
const message = ref("")
const messageColor = ref<"success" | "error">("success")
const loading = ref(false)

async function call<T>(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, ...body },
  })
  if (error || data?.error) throw new Error(data?.error || error?.message)
  return data as T
}

function report(copy: string, isError = false) {
  message.value = copy
  messageColor.value = isError ? "error" : "success"
}

async function load() {
  loading.value = true
  try {
    users.value = (await call<{ users: AdminUser[] }>("list")).users
  } catch (error) {
    report(error instanceof Error ? error.message : "Unable to load users.", true)
  } finally {
    loading.value = false
  }
}

async function invite() {
  loading.value = true
  try {
    const result = await call<{ message: string }>("invite", {
      email: email.value,
      isAdmin: isAdmin.value,
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    report(result.message)
    email.value = ""
    isAdmin.value = false
    await load()
  } catch (error) {
    report(error instanceof Error ? error.message : "Unable to invite user.", true)
  } finally {
    loading.value = false
  }
}

async function sendPasswordReset(user: AdminUser) {
  try {
    const result = await call<{ message: string }>("send-password-reset", {
      email: user.email,
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    report(result.message)
  } catch (error) {
    report(error instanceof Error ? error.message : "Unable to send reset email.", true)
  }
}

async function toggleAdmin(user: AdminUser) {
  try {
    const result = await call<{ message: string }>("set-admin", {
      userId: user.id,
      isAdmin: !user.isAdmin,
    })
    report(result.message)
    await load()
  } catch (error) {
    report(error instanceof Error ? error.message : "Unable to update access.", true)
  }
}

await load()
</script>

<template>
  <header class="admin-topbar">
    <div><p class="admin-kicker">Department administration</p><h1>User management</h1></div>
    <UBadge variant="soft" :label="`${users.length} user${users.length === 1 ? '' : 's'}`" />
  </header>

  <UAlert v-if="message" class="admin-status" :color="messageColor" :description="message" :icon="messageColor === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'" close @update:open="message = ''" />

  <section class="admin-panel admin-panel-accent" aria-labelledby="invite-title">
    <p class="admin-kicker">Account provisioning</p>
    <h2 id="invite-title">Invite a department user</h2>
    <form class="admin-form-grid" @submit.prevent="invite">
      <label class="admin-field full"><span>Email address</span><UInput v-model="email" type="email" autocomplete="email" required icon="i-lucide-mail" /></label>
      <div class="admin-actions full">
        <UCheckbox v-model="isAdmin" label="Grant administrator access" />
        <UButton type="submit" icon="i-lucide-send" label="Send invitation" :loading="loading" />
      </div>
    </form>
  </section>

  <section aria-labelledby="users-title">
    <div class="admin-topbar">
      <div><p class="admin-kicker">Access roster</p><h2 id="users-title">Department users</h2></div>
      <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" label="Refresh" :loading="loading" @click="load" />
    </div>
    <div class="admin-list">
      <div v-if="!users.length" class="admin-empty">No users were returned.</div>
      <article v-for="user in users" v-else :key="user.id" class="admin-list-row">
        <div>
          <strong>{{ user.email }}</strong>
          <small>{{ user.isAdmin ? "Administrator · " : "" }}{{ user.confirmed ? "Verified" : "Invitation pending" }}</small>
        </div>
        <div class="admin-list-actions">
          <UButton color="neutral" variant="outline" icon="i-lucide-key-round" label="Password reset" @click="sendPasswordReset(user)" />
          <UButton :color="user.isAdmin ? 'error' : 'primary'" variant="soft" :icon="user.isAdmin ? 'i-lucide-shield-minus' : 'i-lucide-shield-plus'" :label="user.isAdmin ? 'Remove admin' : 'Make admin'" @click="toggleAdmin(user)" />
        </div>
      </article>
    </div>
  </section>
</template>
