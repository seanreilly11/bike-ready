'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import AuthModal from '@/components/layout/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { AuthModalContext } from '@/hooks/useAuthModal'

interface AppShellProps {
  children:   React.ReactNode
  wrongCount?: number
  logoOnly?:  boolean
}

export default function AppShell({ children, wrongCount = 0, logoOnly }: AppShellProps) {
  const pathname = usePathname()
  const { isPremium, sendMagicLink } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const openAuth = () => setShowAuth(true)

  return (
    <AuthModalContext.Provider value={openAuth}>
      <Nav
        currentRoute={pathname}
        wrongCount={wrongCount}
        isPremium={isPremium}
        onSignIn={openAuth}
        logoOnly={logoOnly}
      />
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          sendMagicLink={sendMagicLink}
        />
      )}
      {children}
    </AuthModalContext.Provider>
  )
}
