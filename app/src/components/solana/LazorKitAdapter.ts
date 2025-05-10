import { 
    BaseMessageSignerWalletAdapter, 
    WalletName,
    WalletReadyState,
    SignerWalletAdapter,
    WalletError
} from '@solana/wallet-adapter-base';
import { useWallet as useLazorWallet } from '@lazorkit/wallet';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

export const LazorKitWalletName = 'Lazor Kit' as WalletName<'Lazor Kit'>;

export class LazorKitAdapter extends BaseMessageSignerWalletAdapter {
    name = LazorKitWalletName;
    url = 'https://lazor.kit';
    icon = 'https://lazor.kit/favicon.ico';
    
    private _connecting: boolean;
    private _wallet: ReturnType<typeof useLazorWallet>;

    constructor(wallet: ReturnType<typeof useLazorWallet>) {
        super();
        this._connecting = false;
        this._wallet = wallet;
    }

    // Add readyState implementation
    get readyState() {
        return this._wallet.isLoading 
            ? WalletReadyState.Installed
            : WalletReadyState.Installed;
    }

    // Add supportedTransactionVersions implementation
    get supportedTransactionVersions() {
        return new Set(['legacy', 0] as const);
    }

    get publicKey() {
        return this._wallet.smartWalletAuthorityPubkey || null;
    }

    get connected() {
        return this._wallet.isConnected;
    }

    get connecting() {
        return this._connecting;
    }

    async connect() {
        try {
            this._connecting = true;
            await this._wallet.connect();
            this.emit('connect', this._wallet.publicKey);
        } catch (error) {
            this.emit('error', error as WalletError);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect() {
        this._wallet.disconnect();
        this.emit('disconnect');
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const signed = await this._wallet.signMessage(transaction);
            return signed as T;
        } catch (error) {
            this.emit('error', error as WalletError);
            throw error;
        }
    }

    // Add signMessage implementation
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const signedMessage = await this._wallet.signMessage(message);
            return new Uint8Array(signedMessage);
        } catch (error) {
            this.emit('error', error as WalletError);
            throw error;
        }
    }
}