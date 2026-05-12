import { testnetBradbury } from 'genlayer-js/chains'

/**
 * GenLayer Testnet Bradbury
 */
export const bradbury = testnetBradbury;

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '8e434f07a098046f4857b288c3866172'

export const metadata = {
  name: 'GenSphinx',
  description: 'AI-powered riddle game on GenLayer blockchain',
  url: 'https://gensphinx.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}
