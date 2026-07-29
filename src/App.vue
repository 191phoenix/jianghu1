<script setup lang="ts">
import { onMounted } from 'vue'
import AppTabBar from '@/components/AppTabBar.vue'
import BattleView from '@/views/BattleView.vue'
import PathView from '@/views/PathView.vue'
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()

onMounted(() => {
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
    <PathView />
    <BattleView />
  </div>
</template>
