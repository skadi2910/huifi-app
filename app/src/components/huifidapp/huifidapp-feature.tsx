'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useHuifidappProgram } from './huifidapp-data-access'
import { HuifidappCreate, HuifidappList } from './huifidapp-ui'
import { motion } from 'framer-motion'

export default function HuifidappFeature() {
  const { publicKey } = useWallet()
  const { programId } = useHuifidappProgram()

  return publicKey ? (
    <div className="container mx-auto px-4">
      <AppHero
        title={<span className="font-['VT323'] text-5xl glitch-text" data-text="Huifidapp">Huifidapp</span>}
        subtitle={
          <p className="font-mono mt-4 text-[#ffdd00]/80">
            Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program's methods (increment, decrement, set, and close).
          </p>
        }
      >
        <p className="mb-6 neu-box-dark inline-block px-4 py-2">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <HuifidappCreate />
      </AppHero>
      <HuifidappList />
    </div>
  ) : (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="neu-box-yellow p-8 card-glitch">
          <h2 className="font-['VT323'] text-4xl mb-6 text-center glitch-text" data-text="Connect Wallet">Connect Wallet</h2>
          <p className="mb-8 font-mono text-black text-center">Connect your wallet to access the Huifidapp features</p>
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>
      </motion.div>
    </div>
  )
}