import { createFetch } from '@vueuse/core'
import router from '~/route'
const API_WHITE_LIST = [
  '/login',
]

const ERROR_CODE = {
  403: '没有权限',
  404: '没有找到',
  500: '服务器错误',
}

const useFetchData = createFetch({
  baseUrl: '/',
  options: {
    beforeFetch({ options, cancel, url }) {
      // 判断缓存中是否存在token
      const token = useAccessToken()
      if (token.value) {
        // 如果token存在就让他携带token,类型读取错误一直读取到的是string[][],强制进行类型断言，让他使用string
        (options.headers as Record<string, string>).access_token = token.value
      }
      else {
        // 如果不存在我们就需要判断一下，是不是白名单接口，
        // 如果是白名单接口，我们就需要进行请求，如果不是白名单接口，我们就不需要进行请求
        // 同时我们还可以增加一个参数，设置我们的接口是否可以不登录进行请求
        if (!API_WHITE_LIST.includes(url))
          cancel()
      }
      return { options }
    },
    // 请求失败的处理
    async onFetchError(error) {
      // 错误的情况下，需要做什么处理
      // 第一个就是授权过期的问题，一般授权过期的status是401所以我们从response中获取status，来判断是否是401
      const { response, data } = error
      if (response && response.status === 401) {
        // 授权过期了一般情况下我们这里需要使用路由跳转到例如登录页面。这里需要注意的是，我们不能使用useRouter去跳转，
        // 会报错useRouter只能在setup中使用，所以这里我们需要改造一下我们现在的项目，将router中的部分提取到一个独立的文件中去。
        // 授权过期的同时我们需要清空之前我们的token，这样我们就不会出现token过期后我们还能访问到之前的页面了。
        // 按照一般的项目处理逻辑，这里我们应该需要给用户一个提示，提示他授权过期了，然后我们需要跳转到登录页面，
        // 1. 先提示用户授权过期了，
        // 我们一般情况下会使用ui库进行提示，这里我们可以先使用alert进行提示
        // eslint-disable-next-line no-alert
        alert('授权过期了')
        // 2. 清除token
        const token = useAccessToken()
        token.value = null
        // 3. 跳转到登录页面
        await router.push('/login')
      }
      else {
        // 如果不是授权过期的问题，我们就直接使用原来的错误处理方式
        // 一般后端都会给我们返回一个提示信息，我们这里可以直接提示后端返回的错误信息
        if (data && data.message) {
          // eslint-disable-next-line no-alert
          alert(data.message)
        }
        else {
          // 如果没有的话，我们可以在项目中处理，也可以在这里弹出一个错误提示

          // alert(ERROR_CODE[] ?? '服务器错误')
        }
        // eslint-disable-next-line no-alert
      }
      return error
    },
    // 请求成功的数据处理
    afterFetch(response) {
      return response
    },
  },
})

export default useFetchData
