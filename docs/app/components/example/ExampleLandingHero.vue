<script setup lang="ts">
defineProps<{
  image: string
}>()
</script>

<template>
  <section class="flex flex-col sm:flex-row sm:items-center gap-4 py-8 sm:gap-12 sm:py-12 h-[331px]">
    <div class="flex flex-col gap-1">
      <h1 class="text-4xl font-semibold">
        <slot name="title" />
      </h1>
      <div class="text-base text-gray-600 dark:text-gray-300">
        <slot name="description" />
      </div>
    </div>
    <img
      :src="image"
      class="w-1/2 rounded-lg"
    >
  </section>
</template>
