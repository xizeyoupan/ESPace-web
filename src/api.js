import ky from 'ky'

export const api = ky.create({ retry: { limit: 0 } })
export const github_api = api.extend((options) => ({ prefixUrl: `https://api.github.com` }))
