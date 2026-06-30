import { NextResponse } from 'next/server'
import { PSEUDO_COOKIE } from '@/lib/auth'
 
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(PSEUDO_COOKIE)
  return res
}
 