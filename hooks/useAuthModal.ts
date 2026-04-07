'use client'

import { createContext, useContext } from 'react'

export type AuthModalReason = 'save_progress' | 'upgrade'

export type OpenAuthModal = (opts?: { reason?: AuthModalReason }) => void

export const AuthModalContext = createContext<OpenAuthModal>(() => {})
export const useAuthModal = () => useContext(AuthModalContext)
