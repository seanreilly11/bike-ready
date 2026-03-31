import type { NextConfig } from 'next'
import { validateEnv } from './lib/validateEnv'

validateEnv()

const nextConfig: NextConfig = {}

export default nextConfig
