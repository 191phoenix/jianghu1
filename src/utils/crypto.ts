import CryptoJS from 'crypto-js'

// 单机自玩，加密主要防误改与导出文件隐私，非强安全
const SECRET_KEY = 'jianghu1-save-v1'

/** 加密任意可序列化数据，返回 AES 密文字符串 */
export function encryptData(data: unknown): string {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
  } catch (e) {
    console.error('[crypto] encrypt failed', e)
    return ''
  }
}

/** 解密 AES 密文字符串，失败返回 null */
export function decryptData(cipher: string): unknown {
  if (!cipher) return null
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
    const str = bytes.toString(CryptoJS.enc.Utf8)
    return str ? JSON.parse(str) : null
  } catch (e) {
    console.error('[crypto] decrypt failed', e)
    return null
  }
}
