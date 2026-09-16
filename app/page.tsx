'use client'

import Link from 'next/link'
import { Trophy, Zap, Shield, Users, ChevronRight, Star, Coins, Clock, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0D0F1F', color: '#F0F2FF', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>

      {/* Background orbs */}
      <div className="orb orb-gold" />
      <div className="orb orb-teal" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Nimble Quiz Logo" className="h-8 sm:h-9 w-auto object-contain" />
          <span className="text-base sm:text-lg font-bold tracking-tight">Nimble Quiz</span>
        </div>
        <Link
          href="/play"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all btn-gold"
        >
          Launch App <ChevronRight className="size-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-12 lg:px-20 lg:pt-24 text-center">
        <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Stake your knowledge.{' '}
          <span style={{ background: 'linear-gradient(135deg,#E9B213,#EC991C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Win NIM.
          </span>
        </h1>

        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: '#8B8FAD' }}>
          The fastest stake-based quiz game on Nimiq Pay. Create a round, invite friends, everyone stakes NIM — the sharpest mind wins the pot.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/play"
            className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold transition-all btn-gold gold-glow"
          >
            <Zap className="size-5" />
            Start Playing Free
          </Link>
          <a
            href="#how-it-works"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold transition-all"
            style={{ border: '1px solid #2F3355', color: '#8B8FAD' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E9B213'; (e.currentTarget as HTMLElement).style.color = '#E9B213' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2F3355'; (e.currentTarget as HTMLElement).style.color = '#8B8FAD' }}
          >
            See how it works
          </a>
        </div>

        {/* Floating 3D quiz card */}
        <div className="relative mx-auto mt-16 sm:mt-20 max-w-sm float-anim">
          <div className="rounded-2xl p-5 sm:p-6 text-left gold-glow" style={{ background: '#1A1D35', border: '1px solid rgba(233,178,19,0.2)', transform: 'perspective(800px) rotateX(4deg) rotateY(-4deg)' }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Question 3 of 5</span>
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(233,178,19,0.15)', color: '#E9B213' }}>
                <Clock className="size-3.5" /> 12s
              </div>
            </div>
            <p className="text-base font-semibold leading-snug">Which country was the first to adopt Bitcoin as legal tender?</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['El Salvador', 'Nigeria', 'Panama', 'Uruguay'].map((opt, i) => (
                <div key={i} className="rounded-xl p-3 text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: i === 0 ? 'rgba(33,188,165,0.15)' : 'rgba(37,40,71,0.8)',
                    border: i === 0 ? '1px solid rgba(33,188,165,0.5)' : '1px solid rgba(47,51,85,0.8)',
                    color: i === 0 ? '#21BCA5' : '#8B8FAD'
                  }}>
                  <span className="mr-1.5 text-xs">{String.fromCharCode(65 + i)}</span>{opt}
                  {i === 0 && ' ✓'}
                </div>
              ))}
            </div>
          </div>

          {/* Floating stats */}
          <div className="absolute -right-2 sm:-right-8 -top-6 float-anim-slow">
            <div className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold glass" style={{ color: '#E9B213' }}>
              <Trophy className="size-3.5" /> +2 NIM
            </div>
          </div>
          <div className="absolute -left-2 sm:-left-8 -bottom-4 float-anim" style={{ animationDelay: '-1s' }}>
            <div className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs glass" style={{ color: '#21BCA5' }}>
              <Check className="size-3.5" /> Correct!
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 sm:px-12 lg:px-20">
        <div className="grid grid-cols-3 gap-4 rounded-2xl p-6 sm:p-8 glass">
          {[
            { label: 'Built on', value: 'Nimiq', sub: 'Blockchain' },
            { label: 'Payment', value: '< 1s', sub: 'Settlement' },
            { label: 'Payout', value: '100%', sub: 'On-chain verified' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl font-bold sm:text-3xl" style={{ color: '#E9B213' }}>{s.value}</p>
              <p className="mt-0.5 text-xs sm:text-sm" style={{ color: '#8B8FAD' }}>{s.label}</p>
              <p className="text-xs" style={{ color: '#2F3355' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-12 lg:px-20">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Simple by design</p>
          <h2 className="text-3xl font-bold sm:text-5xl">How it works</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: '01',
              icon: <Users className="size-6" />,
              title: 'Host creates a round',
              desc: 'Pick a category, set the stake amount, and share the invite link or QR code with friends.',
              color: '#E9B213',
            },
            {
              step: '02',
              icon: <Coins className="size-6" />,
              title: 'Players stake NIM',
              desc: 'Each player joins through Nimiq Pay, their stake is sent directly to the host\'s wallet.',
              color: '#21BCA5',
            },
            {
              step: '03',
              icon: <Trophy className="size-6" />,
              title: 'Winner takes the pot',
              desc: 'The highest scorer wins. Host pays out via Nimiq Pay — verified on-chain immediately.',
              color: '#EC991C',
            },
          ].map((item, i) => (
            <div key={i} className="card-3d rounded-2xl p-6 sm:p-8" style={{ background: '#1A1D35', border: `1px solid rgba(47,51,85,0.8)` }}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl" style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <span className="text-2xl font-black" style={{ color: '#2F3355' }}>{item.step}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8FAD' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 sm:px-12 lg:px-20">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Why Nimble Quiz</p>
          <h2 className="text-3xl font-bold sm:text-5xl">Everything you need</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Shield className="size-5" />, title: 'On-chain verified', desc: 'Every payment and payout is verified on the Nimiq blockchain — no trust required.', color: '#21BCA5' },
            { icon: <Zap className="size-5" />, title: 'Real-time gameplay', desc: 'Live countdown timers, instant leaderboard updates, and synchronized question delivery.', color: '#E9B213' },
            { icon: <Trophy className="size-5" />, title: 'Flexible payout rules', desc: 'Winner takes all, or top 3 share the pot — you decide when you create the round.', color: '#EC991C' },
            { icon: <Users className="size-5" />, title: 'Up to 12 players', desc: 'Invite your squad, share a QR code or link — anyone with Nimiq Pay can join instantly.', color: '#E9B213' },
            { icon: <Star className="size-5" />, title: 'Share anywhere', desc: 'One-tap sharing to WhatsApp, Telegram, or X. Or display the QR code for in-person games.', color: '#21BCA5' },
            { icon: <Coins className="size-5" />, title: 'Pay All in one go', desc: 'Host pays all winners with a single tap — each Nimiq approval flows sequentially.', color: '#EC991C' },
          ].map((f, i) => (
            <div key={i} className="card-3d rounded-2xl p-5 sm:p-6" style={{ background: '#1A1D35', border: '1px solid rgba(47,51,85,0.8)' }}>
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg" style={{ background: `${f.color}18`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8FAD' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 sm:px-12 lg:px-20">
        <div className="rounded-3xl p-10 text-center sm:p-16 gold-glow" style={{ background: 'linear-gradient(135deg, rgba(233,178,19,0.1) 0%, rgba(26,29,53,0.9) 50%, rgba(33,188,165,0.08) 100%)', border: '1px solid rgba(233,178,19,0.2)' }}>
          <h2 className="text-3xl font-bold sm:text-5xl">Ready to play?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: '#8B8FAD' }}>
            Open Nimiq Pay, tap the link below, and your first round is live in under 60 seconds.
          </p>
          <Link
            href="/play"
            className="mt-8 inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-base font-bold btn-gold"
          >
            <Zap className="size-5" />
            Launch App Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t px-6 py-8 text-center text-sm sm:px-12 lg:px-20" style={{ borderColor: '#2F3355', color: '#8B8FAD' }}>
        <p>Built with ❤️ for the Nimiq Pay Hackathon 2025 · <span style={{ color: '#E9B213' }}>Nimble Quiz</span></p>
      </footer>
    </div>
  )
}
