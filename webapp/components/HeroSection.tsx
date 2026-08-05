'use client'

import { useEffect, useRef } from 'react'
import type { Stats } from '@/types'

interface HeroSectionProps {
  stats: Stats | null
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    class Particle {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; color: string
      constructor() {
        this.x     = Math.random() * (canvas?.width  ?? 800)
        this.y     = Math.random() * (canvas?.height ?? 600)
        this.vx    = (Math.random() - 0.5) * 0.4
        this.vy    = (Math.random() - 0.5) * 0.4
        this.size  = Math.random() * 1.5 + 0.3
        this.alpha = Math.random() * 0.6 + 0.1
        const r    = Math.random()
        this.color = r < 0.55 ? '0,229,255' : r < 0.85 ? '0,255,136' : '255,184,0'
      }
      update() {
        this.x += this.vx; this.y += this.vy
        const W = canvas?.width ?? 800, H = canvas?.height ?? 600
        if (this.x < 0) this.x = W; if (this.x > W) this.x = 0
        if (this.y < 0) this.y = H; if (this.y > H) this.y = 0
      }
      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`
        ctx.fill()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    const particles: Particle[] = Array.from({ length: 160 }, () => new Particle())

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,229,255,${0.08 * (1 - dist / 90)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      particles.forEach(p => { p.update(); p.draw() })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
  }, [])

  const winRate = stats ? (stats.win_rate * 100).toFixed(1) : '—'
  const roi     = stats ? (stats.roi >= 0 ? '+' : '') + (stats.roi * 100).toFixed(1) : '—'
  const record  = stats ? `${stats.wins}-${stats.settled - stats.wins}` : '—'

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100svh', paddingTop: 32, paddingBottom: 40 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.85 }} />

      {/* Scan line */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
          animation: 'scan-sweep 6s ease-in-out infinite',
          top: 0,
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-6">

        {/* Badge */}
        <div className="badge badge-cyan" style={{ fontSize: 11, padding: '5px 14px', borderRadius: 20 }}>
          <span>⚡</span>
          <span>AI-Powered · Quantitative Edge · Free Daily Updates</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1
            className="gradient-text-anim font-bold"
            style={{ fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            MLB AI<br />Prediction Engine
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.35rem)', color: 'var(--text-2)', maxWidth: 520, margin: '0 auto' }}>
            Real-Time Sports Intelligence Platform
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-stretch justify-center gap-3 mt-2">
          {[
            { label: 'Win Rate',  value: `${winRate}%`, accent: 'var(--green)' },
            { label: 'Record',    value: record,         accent: 'var(--cyan)'  },
            { label: 'ROI',       value: `${roi}%`,      accent: 'var(--yellow)'},
            { label: 'AI Models', value: '10',           accent: 'var(--cyan)'  },
          ].map(s => (
            <div key={s.label} className="stat-widget text-center" style={{ minWidth: 110, padding: '14px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a href="#predictions" className="btn-primary" style={{ fontSize: 15 }}>
          View Today&apos;s Predictions
        </a>

        {/* Baseball */}
        <div className="animate-float" style={{ marginTop: 16, position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 32%, #f5efe0, #c8b89a)',
            boxShadow: 'inset -6px -6px 18px rgba(0,0,0,0.28), inset 3px 3px 10px rgba(255,255,255,0.25), 0 0 40px rgba(0,229,255,0.3), 0 0 80px rgba(0,229,255,0.1)',
            position: 'relative', overflow: 'hidden',
          }}>
            <svg viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M20 20 Q30 40 20 60" fill="none" stroke="#cc3333" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M60 20 Q50 40 60 60" fill="none" stroke="#cc3333" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            border: '1px solid rgba(0,229,255,0.25)',
            animation: 'pulse-ring 2.8s ease-out infinite',
          }} />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
          <span style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(0,229,255,0.4), transparent)' }} />
        </div>
      </div>

      <style>{`
        @keyframes scan-sweep {
          0%   { top: -2px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </section>
  )
}
