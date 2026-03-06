'use server'

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'site_auth'

export async function login(password: string) {
    const correctPassword = process.env.SITE_PASSWORD

    if (!correctPassword) {
        // If no password is set, allow anyone (failsafe)
        return { success: true }
    }

    if (password === correctPassword) {
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })
        return { success: true }
    }

    return { success: false, error: '密碼錯誤，請重試。' }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}
