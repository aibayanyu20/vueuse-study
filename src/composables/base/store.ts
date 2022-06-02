import type { MaybeRef, RemovableRef } from '@vueuse/shared'
import type { StorageOptions } from '@vueuse/core'
import { customRef } from 'vue'
import dayjs from 'dayjs'
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const TimeStampPat = /^(\d+)(d|w|M|y|h|m|s|ms|day|week|month|year|hour|minute|second|millisecond)$/
type ValueType = string | number | boolean | object | null

interface BaseStore<T extends ValueType> {
  data: RemovableRef<T>
  setStore: (value: T, expire?: string | null | number) => void
  updateExpires: (expire?: string | null | number) => void
}

interface BaseStorageOptions<T extends ValueType> extends StorageOptions<T> {
  // 如果是数字就按毫秒计算，如果是字符串就按照时间计算
  expires?: number | string | null
  // 是否每次设置值都更新时间戳
  updateTimestamp?: boolean
}

export function baseStore(key: string, initialValue: MaybeRef<string>, storage?: StorageLike, options?: BaseStorageOptions<string>): BaseStore<string>
export function baseStore(key: string, initialValue: MaybeRef<boolean>, storage?: StorageLike, options?: BaseStorageOptions<boolean>): BaseStore<boolean>
export function baseStore(key: string, initialValue: MaybeRef<number>, storage?: StorageLike, options?: BaseStorageOptions<number>): BaseStore<number>
export function baseStore<T extends ValueType>(key: string, initialValue: MaybeRef<T>, storage?: StorageLike, options?: BaseStorageOptions<T>): BaseStore<T>

export function baseStore<T extends ValueType>(
  key: string,
  initialValue: MaybeRef<T>,
  storage: StorageLike | undefined,
  options: BaseStorageOptions<T> = {},
): BaseStore<T> {
  const {
    onError = (e) => {
      console.error(e)
    },
    expires = null,
    updateTimestamp = false,
    ...restOptions
  } = options
  const _timestamp = shallowRef<number | null>(null)
  const expiresTime = shallowRef<number | string | null | undefined>(expires)
  const isExpire = shallowRef<boolean>(false)
  const setTimestamp = () => {
    if (expiresTime.value) {
      // 判断类型
      if (typeof expiresTime.value === 'number') {
        // 毫秒
        _timestamp.value = Date.now() + expiresTime.value
        isExpire.value = false
      }
      else {
        // 正则获取时间戳
        if (TimeStampPat.exec(expiresTime.value)) {
          const [, num, unit] = TimeStampPat.exec(expiresTime.value)!
          _timestamp.value = dayjs().add(parseFloat(num), unit as any).valueOf()
          isExpire.value = false
        }
        else {
          // 时间格式不正确的提示
          onError(new Error('expires must be a number or a string like \'1d\' or \'1w\''))
        }
      }
    }
  }
  setTimestamp()
  const data = useStorage<T>(key, initialValue, storage, {
    ...restOptions,
  })
  const customData = customRef<T>((track, trigger) => {
    return {
      get: (): T => {
        // 判断一下时间戳是否已经过期
        if (_timestamp.value && Date.now() > _timestamp.value) {
          isExpire.value = true
          data.value = null
        }
        // 获取值
        track()
        return data.value
      },
      set: (value: T) => {
        if (isExpire.value)
          return
        // 设置值
        if (_timestamp.value && Date.now() > _timestamp.value) {
          isExpire.value = true
          data.value = null
        }
        else {
          data.value = value
          if (updateTimestamp)
            setTimestamp()
          trigger()
        }
      },
    }
  })
  const updateExpires = (expire?: string | null | number) => {
    if (expire !== undefined)
      expiresTime.value = expire
    setTimestamp()
  }
  const setValue = (value: T, expire?: string | null | number) => {
    updateExpires(expire)
    customData.value = value
  }
  return {
    data: customData,
    setStore: setValue,
    updateExpires,
  }
}
