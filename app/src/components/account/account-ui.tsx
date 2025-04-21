'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <div>
      <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  )
}
export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  
  if (query.isError || !query.data) {
    return (
      <div className="bg-[#010200]/80 border-b-4 border-[#ffdd00] p-4 flex justify-center items-center space-x-4">
        <span className="font-mono text-[#ffdd00]/80">
          You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
        </span>
        <div className="relative inline-block">
          <div className="btn-wrapper absolute inset-0 z-0"></div>
          <button
            className="btn-glitch relative z-10 px-4 py-2 text-sm"
            onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}
            disabled={mutation.isPending}
          >
            <span className="text font-mono">Airdrop 1 SOL</span>
            {mutation.isPending && <span className="ml-2 animate-pulse">...</span>}
          </button>
        </div>
      </div>
    )
  }
  
  return null
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <div>
      <ModalAirdrop hide={() => setShowAirdropModal(false)} address={address} show={showAirdropModal} />
      <ModalReceive address={address} show={showReceiveModal} hide={() => setShowReceiveModal(false)} />
      <ModalSend address={address} show={showSendModal} hide={() => setShowSendModal(false)} />
      
      <div className="flex space-x-3">
        {!cluster.network?.includes('mainnet') && (
          <div className="relative inline-block">
            <div className="btn-wrapper absolute inset-0 z-0"></div>
            <button
              className="btn-glitch relative z-10 px-4 py-2 text-sm"
              onClick={() => setShowAirdropModal(true)}
            >
              <span className="text font-mono">Airdrop</span>
            </button>
          </div>
        )}
        
        {wallet.publicKey?.toString() === address.toString() && (
          <div className="relative inline-block">
            <div className="btn-wrapper absolute inset-0 z-0"></div>
            <button
              className="btn-glitch relative z-10 px-4 py-2 text-sm"
              onClick={() => setShowSendModal(true)}
            >
              <span className="text font-mono">Send</span>
            </button>
          </div>
        )}
        
        <div className="relative inline-block">
          <div className="btn-wrapper absolute inset-0 z-0"></div>
          <button
            className="btn-glitch relative z-10 px-4 py-2 text-sm"
            onClick={() => setShowReceiveModal(true)}
          >
            <span className="text font-mono">Receive</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch()
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  })
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink label={ellipsify(pubkey.toString())} path={`account/${pubkey.toString()}`} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">{account.data.parsed.info.tokenAmount.uiAmount}</span>
                    </td>
                  </tr>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button className="btn btn-xs btn-outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-mono text-[#ffdd00]">Transaction History</h2>
        <div>
          {query.isLoading ? (
            <div className="w-6 h-6 border-2 border-[#ffdd00]/20 border-t-[#ffdd00] rounded-full animate-spin"></div>
          ) : (
            <button 
              className="text-[#ffdd00] hover:text-[#ffdd00]/80 transition p-2 rounded-md"
              onClick={() => query.refetch()}
            >
              <IconRefresh size={18} />
            </button>
          )}
        </div>
      </div>
      
      {query.isError && (
        <div className="bg-[#010200]/80 border-2 border-red-500/50 p-3 rounded-lg">
          <pre className="font-mono text-red-400">Error: {query.error?.message.toString()}</pre>
        </div>
      )}
      
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div className="text-center py-8 font-mono text-[#ffdd00]/70">No transactions found.</div>
          ) : (
            <div className="bg-[#010200]/50 border-4 border-[#ffdd00] rounded-lg overflow-hidden">
              <table className="w-full font-mono">
                <thead className="bg-[#010200]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#ffdd00] border-b border-[#ffdd00]/30">Signature</th>
                    <th className="px-4 py-3 text-right text-[#ffdd00] border-b border-[#ffdd00]/30">Slot</th>
                    <th className="px-4 py-3 text-left text-[#ffdd00] border-b border-[#ffdd00]/30">Block Time</th>
                    <th className="px-4 py-3 text-right text-[#ffdd00] border-b border-[#ffdd00]/30">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item) => (
                    <tr key={item.signature} className="hover:bg-[#ffdd00]/5">
                      <td className="font-mono px-4 py-3 border-b border-[#ffdd00]/10 text-[#ffdd00]/80">
                        <ExplorerLink path={`tx/${item.signature}`} label={ellipsify(item.signature, 8)} className="hover:text-[#ffdd00]" />
                      </td>
                      <td className="font-mono px-4 py-3 border-b border-[#ffdd00]/10 text-right text-[#ffdd00]/80">
                        <ExplorerLink path={`block/${item.slot}`} label={item.slot.toString()} className="hover:text-[#ffdd00]" />
                      </td>
                      <td className="px-4 py-3 border-b border-[#ffdd00]/10 text-[#ffdd00]/80">
                        {new Date((item.blockTime ?? 0) * 1000).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-b border-[#ffdd00]/10 text-right">
                        {item.err ? (
                          <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {(query.data?.length ?? 0) > 5 && (
                <div className="text-center p-3 border-t border-[#ffdd00]/20">
                  <div className="relative inline-block">
                    <div className="btn-wrapper absolute inset-0 z-0"></div>
                    <button 
                      className="btn-glitch relative z-10 px-4 py-1 text-sm"
                      onClick={() => setShowAll(!showAll)}
                    >
                      <span className="text font-mono">{showAll ? 'Show Less' : 'Show All'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
}

function ModalReceive({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  return (
    <AppModal title="Receive" isOpen={show} setIsOpen={hide}>
      <p className="font-mono text-lg mb-4">Receive assets by sending them to your public key:</p>
      <div className="bg-[#010200] border-2 border-[#ffdd00]/30 rounded-lg p-3">
        <code className="font-mono text-[#ffdd00] break-all">{address.toString()}</code>
      </div>
    </AppModal>
  )
}

function ModalAirdrop({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  const handleSubmit = () => {
    mutation.mutateAsync(parseFloat(amount)).then(() => hide());
  };

  return (
    <AppModal
      isOpen={show}
      setIsOpen={hide}
      title="Airdrop"
    >
      <div className="space-y-4">
        <div className="font-mono">Request SOL from the faucet (devnet/testnet only)</div>
        <input
          disabled={mutation.isPending}
          type="number"
          step="any"
          min="1"
          placeholder="Amount"
          className="w-full px-3 py-2 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        
        <div className="flex justify-end pt-4">
          <div className="relative inline-block">
            <div className="btn-wrapper absolute inset-0 z-0"></div>
            <button
              disabled={!amount || mutation.isPending}
              onClick={handleSubmit}
              className="btn-glitch relative z-10 px-6 py-2"
            >
              <span className="text font-mono">Request Airdrop</span>
              {mutation.isPending && <span className="ml-2 animate-pulse">...</span>}
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}

function ModalSend({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div className="font-mono text-[#ffdd00]">Wallet not connected</div>
  }

  const handleSubmit = () => {
    mutation
      .mutateAsync({
        destination: new PublicKey(destination),
        amount: parseFloat(amount),
      })
      .then(() => hide());
  };

  return (
    <AppModal
      isOpen={show}
      setIsOpen={hide}
      title="Send SOL"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-lg mb-2 font-mono text-[#ffdd00]">Destination Address</label>
          <input
            disabled={mutation.isPending}
            type="text"
            placeholder="Enter wallet address"
            className="w-full px-3 py-2 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg mb-2 font-mono text-[#ffdd00]">Amount (SOL)</label>
          <input
            disabled={mutation.isPending}
            type="number"
            step="any"
            min="0.001"
            placeholder="Amount"
            className="w-full px-3 py-2 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <div className="relative inline-block">
            <div className="btn-wrapper absolute inset-0 z-0"></div>
            <button
              disabled={!destination || !amount || mutation.isPending}
              onClick={handleSubmit}
              className="btn-glitch relative z-10 px-6 py-2"
            >
              <span className="text font-mono">Send SOL</span>
              {mutation.isPending && <span className="ml-2 animate-pulse">...</span>}
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
