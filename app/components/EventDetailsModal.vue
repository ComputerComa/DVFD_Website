<script setup lang="ts">
import type { SelectedEvent } from "~/types/domain"

defineProps<{
  event: SelectedEvent | null
}>()
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <UModal
    :open="Boolean(event)"
    :title="event?.title"
    :description="event?.details || 'More details will be shared soon.'"
    @update:open="!$event && emit('close')"
  >
    <template #body>
      <div v-if="event" class="event-modal-content">
        <div>
          <p>{{ event.details || "More details will be shared soon." }}</p>
          <p v-if="event.location" class="event-modal-location">{{ event.location }}</p>
        </div>
        <div v-if="event.location" class="event-modal-map">
          <iframe
            :title="`Map for ${event.title}`"
            loading="lazy"
            :src="`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`"
          />
          <a
            :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`"
            target="_blank"
            rel="noreferrer"
          >
            Open in Maps →
          </a>
        </div>
      </div>
    </template>
  </UModal>
</template>
