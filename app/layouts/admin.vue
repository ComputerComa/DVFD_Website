<script setup lang="ts">
const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo("/admin/login")
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink class="brand" to="/">
        <img class="brand-logo" src="/dvfd_emblem.png" alt="" />
        <span>Deshler<br />Fire &amp; Rescue</span>
      </NuxtLink>
      <nav class="admin-nav" aria-label="Administration">
        <NuxtLink to="/admin/events">
          <UIcon name="i-lucide-calendar-days" /> Events
        </NuxtLink>
        <NuxtLink to="/admin/users">
          <UIcon name="i-lucide-users" /> Users
        </NuxtLink>
        <NuxtLink to="/">
          <UIcon name="i-lucide-external-link" /> Public site
        </NuxtLink>
      </nav>
      <div class="admin-sidebar-footer">
        <button type="button" @click="signOut">
          <UIcon name="i-lucide-log-out" /> Sign out
        </button>
      </div>
    </aside>
    <header class="admin-mobile-nav">
      <NuxtLink class="brand" to="/">
        <img class="brand-logo" src="/dvfd_emblem.png" alt="" />
        <span>DVFD</span>
      </NuxtLink>
      <nav class="admin-mobile-links" aria-label="Administration">
        <NuxtLink to="/admin/events" aria-label="Events"><UIcon name="i-lucide-calendar-days" /></NuxtLink>
        <NuxtLink to="/admin/users" aria-label="Users"><UIcon name="i-lucide-users" /></NuxtLink>
        <button type="button" aria-label="Sign out" @click="signOut"><UIcon name="i-lucide-log-out" /></button>
      </nav>
    </header>
    <main class="admin-workspace">
      <slot />
    </main>
  </div>
</template>
