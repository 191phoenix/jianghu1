<script setup lang="ts">
import { onMounted } from 'vue'
import AppTabBar from '@/components/AppTabBar.vue'
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()

onMounted(() => {
  // 兼容旧存档 + 结算离线挂机收益
  game.normalize()
  game.checkOffline()
})
</script>

<template>
  <div class="flex min-h-full flex-col">
    <main class="flex-1 overflow-y-auto pb-16">
      <RouterView />
    </main>
    <AppTabBar />
  </div>
</template>
