import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Huifidapp } from '../target/types/huifidapp'

describe('huifidapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Huifidapp as Program<Huifidapp>

  const huifidappKeypair = Keypair.generate()

  it('Initialize Huifidapp', async () => {
    await program.methods
      .initialize()
      .accounts({
        huifidapp: huifidappKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([huifidappKeypair])
      .rpc()

    const currentCount = await program.account.huifidapp.fetch(huifidappKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Huifidapp', async () => {
    await program.methods.increment().accounts({ huifidapp: huifidappKeypair.publicKey }).rpc()

    const currentCount = await program.account.huifidapp.fetch(huifidappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Huifidapp Again', async () => {
    await program.methods.increment().accounts({ huifidapp: huifidappKeypair.publicKey }).rpc()

    const currentCount = await program.account.huifidapp.fetch(huifidappKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Huifidapp', async () => {
    await program.methods.decrement().accounts({ huifidapp: huifidappKeypair.publicKey }).rpc()

    const currentCount = await program.account.huifidapp.fetch(huifidappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set huifidapp value', async () => {
    await program.methods.set(42).accounts({ huifidapp: huifidappKeypair.publicKey }).rpc()

    const currentCount = await program.account.huifidapp.fetch(huifidappKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the huifidapp account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        huifidapp: huifidappKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.huifidapp.fetchNullable(huifidappKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
