import { defineChain } from 'viem'

// Define GenLayer Testnet Bradbury
export const bradbury = defineChain({
  id: 4221,
  name: 'GenLayer Bradbury',
  nativeCurrency: {
    name: 'GenLayer',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-bradbury.genlayer.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Bradbury Scan',
      url: 'https://explorer-bradbury.genlayer.com',
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
