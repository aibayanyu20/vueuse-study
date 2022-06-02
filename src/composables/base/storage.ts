import type { StorageLike, StorageOptions } from '@vueuse/core'
import type { MaybeRef, RemovableRef } from '@vueuse/shared'
import dayjs from 'dayjs'

const EXPIRES_PAT = /^(\d+)(d|w|M|y|h|m|s|ms)$/

interface BaseStorageOptions<T> extends StorageOptions<T> {
  // 超时时间 数字ms  字符串的话， 1d 1h 1m 1s
  expires?: number | string | null
  // 是否自动更新时间戳
  updateTimestamp?: boolean
}

type ValueType = string | number | boolean | object | null

interface BaseStorage<T> {
  data: RemovableRef<T>
  setData: (value: T, expires?: number | string | null) => void
  updateExpires: () => void
}

/**
 * Reactive LocalStorage/SessionStorage.
 *
 * @see https://vueuse.org/useStorage
 * @param key
 * @param initialValue
 * @param storage
 * @param options
 */
export function baseStorage<T extends(ValueType)>(
  key: string,
  initialValue: MaybeRef<T>,
  storage: StorageLike | undefined,
  options: BaseStorageOptions<T> = {},
): BaseStorage<T> {
  const {
    expires = null,
    updateTimestamp = false,
    onError = (e) => {
      console.warn(e)
    },
    ...restOptions
  } = options
  const _timestamp = shallowRef<null | number>(null)
  // 是否已经过期
  const isExpired = shallowRef(false)
  // 存储过期时间
  const _expires = shallowRef(expires)
  const store = useStorage(key, initialValue, storage, {
    onError,
    ...restOptions,
  })
  const changeTimestamp = () => {
    // 判断一下
    if (_expires.value) {
      // 如果有值
      if (typeof _expires.value === 'number') {
        // 如果是数字
        _timestamp.value = Date.now() + _expires.value
        isExpired.value = false
      }
      else {
        // 如果是字符串
        if (EXPIRES_PAT.exec(_expires.value)) {
          const [, num, unit] = EXPIRES_PAT.exec(_expires.value)!
          _timestamp.value = dayjs().add(Number(num), unit as any).valueOf()
          isExpired.value = false
        }
        else {
          onError(new Error(`Invalid expires value: ${_expires.value}`))
        }
      }
    }
    // 没治默认就是永久性的存储
  }
  changeTimestamp()

  // store.value = "122"
  // 1. 去判断是否过期了
  // 2. 没过期我们正常返回值
  // 3. 如果是过期了，我们清空store的值，并且返回null
  const data = customRef<T>((track, trigger) => {
    return {
      get() {
        if (_timestamp.value && Date.now() > _timestamp.value) {
          isExpired.value = true
          store.value = null
        }
        track()
        return store.value
      },
      set(newValue) {
        if (isExpired.value)
          return
        if (_timestamp.value && Date.now() > _timestamp.value) {
          isExpired.value = true
          store.value = null
        }
        else {
          store.value = newValue
          if (updateTimestamp)
            changeTimestamp()
          trigger()
        }
      },
    }
  })
  const setData = (value: T, expires?: number | string | null): void => {
    if (expires !== undefined) {
      _expires.value = expires
      changeTimestamp()
    }
    data.value = value
  }
  return {
    data,
    setData,
    updateExpires: changeTimestamp,
  }
}
