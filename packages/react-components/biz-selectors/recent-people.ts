import type { SelectorPersonRecord } from './types'
import { personIdOf, uniqPeople } from './utils'

export const RECENT_PEOPLE_STORAGE_KEY = 'sc-cloud:biz-selectors:recent-people'

const MAX_RECENT_PEOPLE = 20

const safeStorage = () => {
    if (typeof window === 'undefined') return null
    return window.localStorage
}

export const readRecentPeople = () => {
    try {
        const storage = safeStorage()
        const raw = storage?.getItem(RECENT_PEOPLE_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as SelectorPersonRecord[]
        return Array.isArray(parsed)
            ? parsed.filter((item) => Boolean(personIdOf(item)))
            : []
    } catch {
        return []
    }
}

export const writeRecentPeople = (items: SelectorPersonRecord[]) => {
    try {
        const storage = safeStorage()
        if (!storage) return
        const next = uniqPeople(items).slice(0, MAX_RECENT_PEOPLE)
        storage.setItem(RECENT_PEOPLE_STORAGE_KEY, JSON.stringify(next))
    } catch {
        // 本地缓存不可用时静默降级，不影响主流程
    }
}

export const updateRecentPeople = (items: SelectorPersonRecord[]) => {
    const confirmed = items.filter((item) => Boolean(personIdOf(item)))
    if (!confirmed.length) return
    writeRecentPeople([...confirmed, ...readRecentPeople()])
}
