import { baseStore } from '~/composables/base/store'

const useLang = createGlobalState(() => baseStore('lang', 'zh-CN', undefined, {
  expires: '5s',
  updateTimestamp: true,
}))

export {
  useLang,
}
