'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await login(password)
            if (result.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(result.error || '密碼錯誤')
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試。')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6 group transition-transform hover:scale-110 duration-300">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
                        RuiPYKigo Finance
                    </h1>
                    <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        家庭財務管理系統 - 安全存取
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            輸入存取密碼
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`
                  w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all duration-300
                  text-slate-700 font-medium text-lg tracking-widest
                  ${error ? 'border-red-200 focus:border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-teal-400 focus:bg-white'}
                `}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors"
                                title={showPassword ? '隱藏密碼' : '顯示密碼'}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className={`
              w-full py-4 rounded-2xl font-black text-white text-lg tracking-wide
              flex items-center justify-center gap-2 shadow-xl transition-all duration-300
              ${loading || !password
                                ? 'bg-slate-200 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/25 -translate-y-0.5 active:translate-y-0 active:shadow-md'
                            }
            `}
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                進入 Dashboard <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; 2026 PY & KIGO Family Dashboard. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
