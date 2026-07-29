<script setup lang="ts">
import AppTabBar from '@/components/AppTabBar.vue'
</script>

<template>
  <div class="flex min-h-full flex-col">
    <main class="flex-1 overflow-y-auto pb-16">
      <RouterView />
    </main>
    <AppTabBar />
  </div>
</template>
