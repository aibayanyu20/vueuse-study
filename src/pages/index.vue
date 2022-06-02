<script setup lang="ts">
import { useLang } from '~/composables'
const { data: lang } = useLang()

const handleClick = () => {
  lang.value = lang.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}
</script>

<template>
  <div>
    {{ lang }}
    <button btn @click="handleClick">
      中英
    </button>
  </div>
</template>
