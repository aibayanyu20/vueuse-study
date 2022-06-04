<script lang="ts" setup>
// 获取当前系统的主题色
const colorScheme = usePreferredColorScheme()
console.log(colorScheme.value)
// 获取当前存储的状态
</script>

<template>
  <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
    <router-view />
    <Footer />
  </main>
</template>
