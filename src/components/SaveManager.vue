<script setup lang="ts">
import { ref } from 'vue'
import { exportSave, importSave } from '@/utils/saveIO'

const fileInput = ref<HTMLInputElement | null>(null)
const msg = ref('')

function onExport() {
  exportSave()
  msg.value = '已导出存档文件'
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await importSave(file)
    msg.value = '导入成功，刷新中…'
  } catch (err) {
    msg.value = '导入失败：' + (err as Error).message
  }
  input.value = ''
}
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4">
    <h2 class="mb-2 text-gold">存档管理</h2>
    <div class="flex gap-2">
      <button class="flex-1 rounded bg-primary px-3 py-2 text-primary-fg" @click="onExport">
        导出存档
      </button>
      <button
        class="flex-1 rounded border border-border px-3 py-2 text-fg"
        @click="fileInput?.click()"
      >
        导入存档
      </button>
    </div>
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onImport" />
    <p v-if="msg" class="mt-2 text-xs text-muted">{{ msg }}</p>
    <p class="mt-2 text-xs text-muted">
      导出 = 备份；清浏览器后导入 = 恢复。文件已加密。
    </p>
  </div>
</template>
