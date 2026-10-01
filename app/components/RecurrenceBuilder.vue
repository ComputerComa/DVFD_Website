<script setup lang="ts">
import {
  generateRRule,
  recurrenceDays,
  type RecurrenceValue,
} from "~/utils/recurrence"

const props = defineProps<{
  modelValue: RecurrenceValue
  start: string
}>()
const emit = defineEmits<{
  "update:modelValue": [value: RecurrenceValue]
}>()

const frequencyOptions = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
]
const ordinalOptions = [
  { label: "Same date each month", value: "" },
  { label: "First", value: "1" },
  { label: "Second", value: "2" },
  { label: "Third", value: "3" },
  { label: "Fourth", value: "4" },
  { label: "Last", value: "-1" },
]
const weekdayOptions = [
  { label: "Choose weekday", value: "" },
  ...recurrenceDays.map(([value, label]) => ({ value, label })),
]

function update(patch: Partial<RecurrenceValue>) {
  emit("update:modelValue", { ...props.modelValue, ...patch })
}

function toggleWeekday(day: string) {
  const weekdays = props.modelValue.weekdays.includes(day)
    ? props.modelValue.weekdays.filter((item) => item !== day)
    : [...props.modelValue.weekdays, day]
  update({ weekdays })
}
</script>

<template>
  <fieldset class="recurrence full">
    <legend>Repeats</legend>
    <div class="admin-form-grid">
      <label class="admin-field">
        <span>Frequency</span>
        <USelect
          :model-value="modelValue.frequency"
          :items="frequencyOptions"
          @update:model-value="update({ frequency: $event as RecurrenceValue['frequency'] })"
        />
      </label>
      <label v-if="modelValue.frequency !== 'none'" class="admin-field">
        <span>Every</span>
        <UInput
          :model-value="String(modelValue.interval)"
          type="number"
          min="1"
          @update:model-value="update({ interval: $event })"
        />
      </label>
    </div>

    <template v-if="modelValue.frequency !== 'none'">
      <div v-if="modelValue.frequency === 'weekly'" class="weekday-picker" aria-label="Repeat on weekdays">
        <button
          v-for="[code, label] in recurrenceDays"
          :key="code"
          type="button"
          :class="{ selected: modelValue.weekdays.includes(code) }"
          :aria-pressed="modelValue.weekdays.includes(code)"
          @click="toggleWeekday(code)"
        >
          {{ label }}
        </button>
      </div>
      <div v-if="modelValue.frequency === 'monthly'" class="admin-form-grid">
        <label class="admin-field">
          <span>On the</span>
          <USelect
            :model-value="String(modelValue.monthlyOrdinal)"
            :items="ordinalOptions"
            @update:model-value="update({ monthlyOrdinal: $event })"
          />
        </label>
        <label v-if="modelValue.monthlyOrdinal" class="admin-field">
          <span>Weekday</span>
          <USelect
            :model-value="modelValue.monthlyWeekday"
            :items="weekdayOptions"
            @update:model-value="update({ monthlyWeekday: $event })"
          />
        </label>
      </div>
      <label class="admin-field">
        <span>End repeat on</span>
        <UInput
          :model-value="modelValue.until"
          type="date"
          @update:model-value="update({ until: String($event) })"
        />
      </label>
      <output class="rrule-output">{{ generateRRule(start, modelValue) }}</output>
    </template>
  </fieldset>
</template>
