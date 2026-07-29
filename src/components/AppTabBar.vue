<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { name: 'home', label: '主城', path: '/', icon: '🏯' },
  { name: 'jianghu', label: '江湖', path: '/jianghu', icon: '⚔️' },
  { name: 'inventory', label: '背包', path: '/inventory', icon: '🎒' },
  { name: 'heroes', label: '侠客', path: '/heroes', icon: '🧙' },
  { name: 'character', label: '角色', path: '/character', icon: '👤' }
]
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 flex border-t border-border bg-surface">
    <RouterLink
      v-for="t in tabs"
      :key="t.name"
      :to="t.path"
      class="flex flex-1 flex-col items-center py-2 text-xs"
      :class="route.name === t.name ? 'text-primary' : 'text-muted'"
    >
      <span class="text-xl">{{ t.icon }}</span>
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>
