<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import SaveManager from '@/components/SaveManager.vue'

const game = useGameStore()
const nameInput = ref(game.player.name)

function saveName() {
  game.setPlayerName(nameInput.value)
  game.touchSave()
}
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">角色</h1>

    <div class="rounded-lg border border-border bg-surface p-4">
      <label class="mb-1 block text-sm text-muted">角色名</label>
      <div class="flex gap-2">
        <input
          v-model="nameInput"
          class="flex-1 rounded border border-border bg-bg px-2 py-1 text-fg"
        />
        <button class="rounded bg-primary px-3 text-primary-fg" @click="saveName">保存</button>
      </div>
      <p class="mt-2 text-xs text-muted">保存后刷新页面，名字仍在 = 存档生效</p>
    </div>

    <SaveManager />
  </div>
</template>
