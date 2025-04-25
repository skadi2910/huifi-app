'use client'

import { getHuifidappProgram, getHuifidappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useHuifidappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getHuifidappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getHuifidappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['huifidapp', 'all', { cluster }],
    queryFn: () => program.account.huifidapp.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['huifidapp', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ huifidapp: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useHuifidappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useHuifidappProgram()

  const accountQuery = useQuery({
    queryKey: ['huifidapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.huifidapp.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['huifidapp', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ huifidapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['huifidapp', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ huifidapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['huifidapp', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ huifidapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['huifidapp', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ huifidapp: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
