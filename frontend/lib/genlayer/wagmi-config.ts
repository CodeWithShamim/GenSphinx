import { defineChain } from 'viem'

// Define GenLayer Studio (Studionet) chain
export const studionet = defineChain({
  id: 61999,
  name: 'GenLayer Studio',
  nativeCurrency: {
    name: 'GenLayer',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Scan',
      url: 'https://scan.genlayer.com',
    },
  },
  testnet: true,
})

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '8e434f07a098046f4857b288c3866172'

export const metadata = {
  name: 'GenSphinx',
  description: 'AI-powered riddle game on GenLayer blockchain',
  url: 'https://gensphinx.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}
