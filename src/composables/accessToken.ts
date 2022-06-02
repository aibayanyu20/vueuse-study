const useAccessToken = createGlobalState(() => useStorage<string | null>('access_token', null))

export {
  useAccessToken,
}
