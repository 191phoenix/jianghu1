let counter = 0

/** 生成唯一 id */
export function genId(prefix = 'id'): string {
  counter++
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
