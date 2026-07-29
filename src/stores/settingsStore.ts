import { defineStore } from 'pinia'

/** 设置 store（主题/音效等，阶段 0 仅占位字段） */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
    soundEnabled: true
  }),
  persist: {
    key: 'jianghu1-settings',
    storage: localStorage
  }
})
