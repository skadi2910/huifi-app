import './globals.css'
import { ClusterProvider } from '@/components/cluster/cluster-data-access'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { UiLayout } from '@/components/ui/ui-layout'
import { ReactQueryProvider } from './react-query-provider'
import { TransactionProvider } from '@/contexts/TransactionContext'

export const metadata = {
  title: 'HuiFi - Solana Rotating Savings',
  description: 'Play, Save & Earn with Solana Rotating Savings Games',
}

const links: { label: string; path: string }[] = [
  { label: 'Dashboard', path: '/app/dashboard' },
  { label: 'Games', path: '/app/pools' },
  { label: 'Account', path: '/account' },
  { label: 'Admin', path: '/huifidapp' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <TransactionProvider>
                <UiLayout links={links}>{children}</UiLayout>
              </TransactionProvider>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
