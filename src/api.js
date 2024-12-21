import ky from 'ky'
import { DEFAULT_TIMEOUT_MS } from './config'

export const api = ky.create({ headers: {}, timeout: DEFAULT_TIMEOUT_MS, retry: { limit: 0 } })
export const github_api = api.extend((options) => ({ prefixUrl: `https://api.github.com` }))
