import { cookies } from 'next/headers'

export const PSEUDO_COOKIE = 'biere_pseudo'
export const GOAL = parseInt(process.env.NEXT_PUBLIC_GOAL || '5000')

export async function getPseudo(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(PSEUDO_COOKIE)?.value ?? null
}

export function validateInviteCode(code: string): boolean {
  return code.trim() === process.env.INVITE_CODE
}
