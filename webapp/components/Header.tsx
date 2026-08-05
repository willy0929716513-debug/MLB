'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(2,6,23,0.92)' : 'rgba(2,6,23,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(0,229,255,0.12)'
          : '1px solid rgba(0,229,255,0.06)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,229,255,0.3), transparent)',
                animation: 'pulse-ring 2.5s ease-out infinite',
                opacity: 0.6,
              }}
            />
            <span style={{ fontSize: 20 }}>⚾</span>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
              MLB <span className="neon-cyan">AI</span>
            </span>
            <span className="hidden sm:inline" style={{ fontSize: 16, color: 'var(--text-2)', marginLeft: 4 }}>
              Predictions
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="#predictions">Today&apos;s Picks</NavLink>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            padding: 8,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            minHeight: 40,
            minWidth: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="md:hidden"
        >
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                display: 'block',
                width: 20,
                height: 2,
                background: 'var(--cyan)',
                borderRadius: 2,
                transition: 'all 0.2s',
                transform:
                  i === 0 && menuOpen ? 'rotate(45deg) translate(4px, 5px)' :
                  i === 2 && menuOpen ? 'rotate(-45deg) translate(4px, -5px)' : 'none',
                opacity: i === 1 && menuOpen ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: 'rgba(2,6,23,0.97)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            <MobileNavLink href="/" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
            <MobileNavLink href="#predictions" onClick={() => setMenuOpen(false)}>Today&apos;s Picks</MobileNavLink>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ color: 'var(--text-2)', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'rgba(0,229,255,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--border)',
        color: 'var(--text-1)', textDecoration: 'none',
        fontSize: 14, fontWeight: 500,
      }}
    >
      {children}
    </Link>
  )
}
