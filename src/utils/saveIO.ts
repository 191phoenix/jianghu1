import { saveAs } from 'file-saver'
import { useGameStore } from '@/stores/gameStore'
import { encryptData, decryptData } from './crypto'

/** 导出当前存档为加密的 .json 文件 */
export function exportSave(): void {
  const store = useGameStore()
  const cipher = encryptData(store.$state)
  const blob = new Blob([cipher], { type: 'application/json' })
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  saveAs(blob, `jianghu1-save-${ts}.json`)
}

/** 从加密的 .json 文件导入存档，覆盖当前状态后刷新页面 */
export async function importSave(file: File): Promise<void> {
  const text = await file.text()
  const data = decryptData(text)
  if (!data || typeof data !== 'object') {
    throw new Error('存档文件解析失败或已损坏')
  }
  const store = useGameStore()
  store.$patch(data as Record<string, unknown>)
  location.reload()
}
