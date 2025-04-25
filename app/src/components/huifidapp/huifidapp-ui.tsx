'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useHuifidappProgram, useHuifidappProgramAccount } from './huifidapp-data-access'
import { motion } from 'framer-motion'

export function HuifidappCreate() {
  const { initialize } = useHuifidappProgram()

  return (
    <button
      className="btn-glitch"
      onClick={() => initialize.mutateAsync(Keypair.generate())}
      disabled={initialize.isPending}
    >
      <span className="text">// Create</span>
      <span className="text-decoration">_</span>
      <span className="decoration">⇒</span>
      {initialize.isPending && <span className="ml-2">...</span>}
    </button>
  )
}

export function HuifidappList() {
  const { accounts, getProgramAccount } = useHuifidappProgram()

  if (getProgramAccount.isLoading) {
    return <div className="loading-neu mx-auto"></div>
  }
  
  if (!getProgramAccount.data?.value) {
    return (
      <motion.div 
        className="neu-box-dark p-8 text-center max-w-xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-['VT323'] text-2xl text-[#ffdd00]">Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </motion.div>
    )
  }
  
  return (
    <div className="space-y-8 py-8">
      {accounts.isLoading ? (
        <div className="loading-neu mx-auto"></div>
      ) : accounts.data?.length ? (
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {accounts.data?.map((account) => (
            <HuifidappCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="neu-box-dark p-8 text-center max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-['VT323'] mb-4 glitch-text text-[#ffdd00]" data-text="No accounts">No accounts</h2>
          <p className="font-mono text-[#ffdd00]/80">No accounts found. Create one above to get started.</p>
        </motion.div>
      )}
    </div>
  )
}

function HuifidappCard({ account }: { account: PublicKey }) {
  const { accountQuery, incrementMutation, setMutation, decrementMutation, closeMutation } = useHuifidappProgramAccount({
    account,
  })

  const count = useMemo(() => accountQuery.data?.count ?? 0, [accountQuery.data?.count])

  return accountQuery.isLoading ? (
    <div className="loading-neu mx-auto"></div>
  ) : (
    <motion.div 
      className="neu-box-yellow card-glitch p-8"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="items-center text-center">
        <div className="space-y-6">
          <h2 
            className="text-5xl font-['VT323'] cursor-pointer glitch-text text-black" 
            data-text={count} 
            onClick={() => accountQuery.refetch()}
          >
            {count}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              className="btn-glitch text-sm min-w-0 w-full"
              onClick={() => incrementMutation.mutateAsync()}
              disabled={incrementMutation.isPending}
            >
              <span className="text">++</span>
            </button>
            <button
              className="btn-glitch text-sm min-w-0 w-full"
              onClick={() => {
                const value = window.prompt('Set value to:', count.toString() ?? '0')
                if (!value || parseInt(value) === count || isNaN(parseInt(value))) {
                  return
                }
                return setMutation.mutateAsync(parseInt(value))
              }}
              disabled={setMutation.isPending}
            >
              <span className="text">=</span>
            </button>
            <button
              className="btn-glitch text-sm min-w-0 w-full"
              onClick={() => decrementMutation.mutateAsync()}
              disabled={decrementMutation.isPending}
            >
              <span className="text">--</span>
            </button>
          </div>
          <div className="text-center space-y-4">
            <p className="font-mono text-black">
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
            <button
              className="btn-glitch-dark text-sm"
              onClick={() => {
                if (!window.confirm('Are you sure you want to close this account?')) {
                  return
                }
                return closeMutation.mutateAsync()
              }}
              disabled={closeMutation.isPending}
            >
              <span className="text">// Close</span>
              <span className="text-decoration">_</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}