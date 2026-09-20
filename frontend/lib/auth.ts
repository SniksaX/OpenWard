import type { JwtClaims } from '@/lib/types'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const padded = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

export function getJwtRole(): string | null {
  const token = getStoredToken()
  if (!token) return null
  return decodeJwtPayload(token)?.role ?? null
}

export function getJwtUserId(): number | null {
  const token = getStoredToken()
  if (!token) return null
  const id = decodeJwtPayload(token)?.user_id
  return typeof id === 'number' ? id : null
}
