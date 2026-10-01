<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <NuxtLink class="brand" to="/">
    <img class="brand-logo" src="/dvfd_emblem.png" alt="" />
    <span v-if="!compact">Deshler<br />Fire &amp; Rescue</span>
    <span v-else>DVFD</span>
  </NuxtLink>
</template>
