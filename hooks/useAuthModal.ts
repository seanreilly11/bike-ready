'use client'

import { createContext, useContext } from 'react'

export const AuthModalContext = createContext<() => void>(() => {})
export const useAuthModal = () => useContext(AuthModalContext)
