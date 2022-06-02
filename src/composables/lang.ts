import { baseStorage } from '~/composables/base/storage'

const useLang = createGlobalState(() => baseStorage<'zh-CN' | 'en-US' | null >('lang', 'zh-CN', undefined, {
  expires: '10s',
}))

export {
  useLang,
}
