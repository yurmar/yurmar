import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '@/store'
import { login } from '@/store/slice/authSlice'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true })
    }, [isAuthenticated])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await dispatch(login({ email, password })).unwrap()
            navigate('/')
        } catch {
            setError('Неверный email или пароль')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* BG decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 hero-gradient opacity-30" />
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(56,189,248,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="card-block rounded-2xl p-8 border border-white/10 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mx-auto mb-4"
                        >
                            <LogIn className="text-sky-400" size={24} />
                        </motion.div>
                        <h1 className="text-2xl font-bold mb-1">Вход в панель</h1>
                        <p className="text-muted-foreground text-sm">Управление контентом сайта</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                className="w-full rounded-xl input-field px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Пароль</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-xl input-field px-4 py-3 pr-11 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 mt-2"
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
