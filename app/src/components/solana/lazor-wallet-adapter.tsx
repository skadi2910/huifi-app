'use client'

import { WalletAdapterProps, WalletError, WalletName, WalletReadyState, WalletAdapterEvents } from '@solana/wallet-adapter-base'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useWallet as useLazorWallet } from '@lazorkit/wallet'
import { PublicKey, Transaction, TransactionVersion } from '@solana/web3.js'
import { useCallback, useEffect, useMemo } from 'react'
import { EventEmitter } from 'events'

export class LazorWalletAdapter extends EventEmitter implements WalletAdapterProps {
  name = 'Lazor Wallet' as WalletName<'Lazor Wallet'>
  url = 'https://lazorkit.com'
  icon = '🔑' // You can replace this with your own icon
  readyState = WalletReadyState.Installed
  publicKey: PublicKey | null = null
  connecting = false
  connected = false
  autoConnect = async () => {
    try {
      await this.connect()
    } catch (error) {
      // Handle auto-connect error
    }
  }
  supportedTransactionVersions = new Set<TransactionVersion>(['legacy', 0])

  constructor() {
    super()
    this.readyState = WalletReadyState.Installed
  }

  async connect(): Promise<void> {
    try {
      const wallet = useLazorWallet()
      await wallet.connect()
      this.connected = true
      this.publicKey = wallet.publicKey ? new PublicKey(wallet.publicKey) : null
    } catch (error) {
      throw new WalletNotConnectedError()
    }
  }

  async disconnect(): Promise<void> {
    const wallet = useLazorWallet()
    await wallet.disconnect()
    this.connected = false
    this.publicKey = null
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    const wallet = useLazorWallet()
    if (!wallet.publicKey) throw new WalletNotConnectedError()
    // Implement your transaction sending logic here
    return 'transaction_signature'
  }

  async signTransaction(transaction: any): Promise<any> {
    const wallet = useLazorWallet()
    if (!wallet.publicKey) throw new WalletNotConnectedError()
    return transaction
  }

  async signAllTransactions(transactions: any[]): Promise<any[]> {
    const wallet = useLazorWallet()
    if (!wallet.publicKey) throw new WalletNotConnectedError()
    return transactions
  }

  // Add required event emitter methods
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  once(event: string, listener: (...args: any[]) => void): this {
    return super.once(event, listener)
  }

  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener)
  }

  eventNames(): (keyof WalletAdapterEvents)[] {
    return ['connect', 'disconnect', 'error'];
  }
}
