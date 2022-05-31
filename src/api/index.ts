import { createFetch } from '@vueuse/core'

const useFetchData = createFetch({
  baseUrl: '/',
  options: {
    beforeFetch({ options }) {
      // 从缓存获取token
      options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
      return { options }
    },
  },
})

export default useFetchData
