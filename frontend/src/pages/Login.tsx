import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import Wordmark from '../components/ui/Wordmark'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import MonoEyebrow from '../components/ui/MonoEyebrow'

const HERO_IMG =
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=2000&q=80&auto=format&fit=crop'

const STATS: Array<[string, string]> = [
  ['2,418', 'Open orders today'],
  ['184', 'Live RFQs'],
  ['98.7%', 'On-time dispatch · 30d'],
]

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] grid-cols-1"
      style={{ background: 'var(--color-paper)', fontFamily: 'var(--font-sans)' }}
    >
      {/* LEFT — branded photography */}
      <div
        className="relative overflow-hidden hidden lg:block"
        style={{ background: 'var(--color-ink)' }}
      >
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'grayscale(0.1) saturate(0.85)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(13,17,23,0.55) 0%, rgba(13,17,23,0.92) 100%)',
          }}
        />

        <div className="absolute top-10 left-12">
          <Wordmark variant="dark" sub="ERP" size={26} />
        </div>

        <div
          className="absolute bottom-14 left-12 right-12"
          style={{ color: 'var(--color-paper)' }}
        >
          <div
            className="inline-flex items-center gap-3 mb-5 uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '.22em',
              color: 'var(--color-warm)',
            }}
          >
            <span style={{ width: 28, height: 1, background: 'var(--color-warm)' }} />
            Ami ERP · v4.0
          </div>

          <h2
            className="m-0"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 300,
              fontSize: 56,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 540,
            }}
          >
            One workbench for sales, requisitions, CRM,{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--color-warm)' }}>
              and the plant floor.
            </span>
          </h2>

          <div
            className="grid grid-cols-3 gap-6 mt-10 pt-6"
            style={{ borderTop: '1px solid var(--rule)' }}
          >
            {STATS.map(([value, label]) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 300,
                    fontSize: 28,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                    color: 'var(--color-paper)',
                  }}
                >
                  {value}
                </div>
                <div
                  className="uppercase mt-2"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '.16em',
                    color: 'var(--mute)',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div
        className="flex items-center justify-center p-8 lg:p-12"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
      >
        <div className="w-full max-w-[420px]">
          {/* Show wordmark on mobile where the left panel is hidden */}
          <div className="lg:hidden mb-8">
            <Wordmark variant="light" sub="ERP" size={26} />
          </div>

          <div className="mb-6">
            <MonoEyebrow tone="warm" size={11}>
              Sign in
            </MonoEyebrow>
          </div>

          <h1
            className="m-0 mb-2"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 300,
              fontSize: 48,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            Welcome back.
          </h1>
          <p
            className="mt-2 mb-10"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--mute-lt)',
            }}
          >
            Use your work credentials. Contact admin if you need access.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="vikram.m"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
            />

            <div className="flex justify-end -mt-2">
              <a
                href="#"
                style={{
                  fontSize: 13,
                  color: 'var(--color-warm-dk)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Forgot?
              </a>
            </div>

            <Button
              type="submit"
              variant="warm"
              fullWidth
              disabled={loading}
              trailingIcon={<ArrowRight size={16} />}
            >
              {loading ? 'Signing in…' : 'Sign in to ERP'}
            </Button>
          </form>

          <div
            className="mt-6 px-4 py-3.5"
            style={{
              border: '1px dashed var(--rule-lt-strong)',
              fontSize: 12,
              color: 'var(--mute-lt)',
              lineHeight: 1.5,
            }}
          >
            <span
              className="uppercase mr-2"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '.16em',
                color: 'var(--color-warm-dk)',
              }}
            >
              SSO
            </span>
            Plant supervisors — sign in with your kiosk credentials.
          </div>

          <div
            className="mt-10 uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '.16em',
              color: 'var(--mute-lt)',
            }}
          >
            © Ami Group · ERP v4.0
          </div>
        </div>
      </div>
    </div>
  )
}
