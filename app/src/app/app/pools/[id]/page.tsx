// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Coins, Trophy, Zap, CheckCircle, 
//   Wallet, AlertTriangle, Info, Users, Clock,
//   TrendingUp, Shield, History, ArrowRight
// } from 'lucide-react';
// import { useHuifiPools, PoolWithKey } from '@/hooks/useHuifiPools';
// import { PublicKey } from '@solana/web3.js';
// // Mock data with more comprehensive information
// const MOCK_POOL_DATA = {
//   id: 'A7B2C3',
//   status: 'Active',
//   totalValue: '50,000 USDC',
//   participants: {
//     current: 8,
//     max: 10
//   },
//   rounds: {
//     current: 3,
//     total: 10
//   },
//   dates: {
//     created: '2024-03-01',
//     started: '2024-03-05',
//     nextPayout: '2024-03-20',
//     estimatedEnd: '2024-05-20'
//   },
//   financials: {
//     contributionAmount: '1,000 USDC',
//     totalContributed: '8,000 USDC',
//     yieldEarned: '420 USDC',
//     apy: '5.2%',
//     earlyWithdrawalFee: '5%'
//   },
//   timing: {
//     frequency: 'Weekly',
//     nextPayoutIn: '2d 5h 30m',
//     roundDuration: '7 days'
//   },
//   user: {
//     position: 5,
//     roundsToWait: 2,
//     contributed: '1,000 USDC',
//     earned: '150 USDC',
//     status: 'Active Member'
//   },
//   stats: {
//     totalMembers: 8,
//     totalPayouts: '12,000 USDC',
//     averageYield: '4.8%',
//     completedRounds: 2
//   },
//   security: {
//     contract: 'HuiFi...x8Kt',
//     creator: '8xzt7...3Pda',
//     verified: true,
//     audited: true
//   },
//   history: [
//     { date: '2024-03-15', type: 'Payout', amount: '1,000 USDC', recipient: '8xzt7...3Pda' },
//     { date: '2024-03-08', type: 'Contribution', amount: '1,000 USDC', recipient: '9yzt8...4Qdb' },
//     { date: '2024-03-01', type: 'Pool Created', creator: '8xzt7...3Pda' }
//   ]
// };

// type ActionConfig = {
//   title: string;
//   description: string;
//   buttonText: string;
//   min?: string;  // Make min optional
//   max?: string;  // Make max optional
// };

// const PoolDetailPage:React.FC<{params: {id: string}}> = ({params}) => {
//   const router = useRouter();
//   const [activeAction, setActiveAction] = useState<string | null>(null);
//   const [actionAmount, setActionAmount] = useState<string>('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [activeTab, setActiveTab] = useState('overview');

//   const publicKey = useMemo(() => new PublicKey(params.id), [params.id]);
//   console.log(`id: ${publicKey}`);
//   const [poolData, setPoolData] = useState<PoolWithKey | null>(null);
//   const { fetchPoolDetails } = useHuifiPools();

//   useEffect(() => {
//     const loadPoolData = async () => {
//       try {
//         const data = await fetchPoolDetails(new PublicKey(publicKey));
//         setPoolData(data);
//       } catch (error) {
//         console.error('Error fetching pool details:', error);
//       }
//     };

//     loadPoolData();
//   }, [publicKey, fetchPoolDetails]);
//   console.log(`poolData: ${poolData}`);
//   // Mock action handlers
//   const handleAction = async () => {
//     setIsProcessing(true);
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     setIsProcessing(false);
//     setActiveAction(null);
//     setActionAmount('');
//   };

//   // Action modal component
//   const ActionModal = () => {
//     if (!activeAction) return null;

//     const actionConfig: Record<string, ActionConfig> = {
//       bid: {
//         title: 'Place Bid for Next Round',
//         description: 'Increase your chances of winning by placing a competitive bid. Current highest bid: 50 USDC',
//         buttonText: 'Place Bid',
//         min: '10 USDC',
//         max: '500 USDC'
//       },
//       contribute: {
//         title: 'Contribute to Pool',
//         description: `Minimum contribution: ${MOCK_POOL_DATA.financials.contributionAmount}`,
//         buttonText: 'Contribute',
//         min: '1,000 USDC',
//         max: '5,000 USDC'
//       },
//       withdraw: {
//         title: 'Withdraw Funds',
//         description: `Available for withdrawal: ${MOCK_POOL_DATA.user.contributed}\nEarly withdrawal fee: ${MOCK_POOL_DATA.financials.earlyWithdrawalFee}`,
//         buttonText: 'Withdraw',
//       },
//       claim: {
//         title: 'Claim Payout',
//         description: `Available to claim: ${MOCK_POOL_DATA.user.earned}`,
//         buttonText: 'Claim Payout',
//       },
//       progress: {
//         title: 'Progress Pool',
//         description: 'Progress the pool to the next round. This will trigger the next payout and update the pool status. Only available to the pool creator.',
//         buttonText: 'Progress Pool',
//       }
//     };

//     const config = actionConfig[activeAction as keyof typeof actionConfig];

//     return (
//       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//         <div className="bg-[#1a1a18] rounded-xl p-6 max-w-md w-full mx-4">
//           <h3 className="text-xl font-bold text-[#e6ce04] mb-2">{config.title}</h3>
//           <p className="text-[#f8e555]/70 mb-4 whitespace-pre-line">{config.description}</p>
          
//           {(activeAction === 'bid' || activeAction === 'contribute') && (
//             <div className="space-y-4 mb-4">
//               <input
//                 type="number"
//                 value={actionAmount}
//                 onChange={(e) => setActionAmount(e.target.value)}
//                 placeholder="Enter amount in USDC"
//                 className="w-full px-4 py-2 bg-[#010200] border-2 border-[#e6ce04]/30 rounded-lg text-[#e6ce04]"
//               />
//               {config.min && config.max && (
//                 <div className="flex justify-between text-sm text-[#f8e555]/70">
//                   <span>Min: {config.min}</span>
//                   <span>Max: {config.max}</span>
//                 </div>
//               )}
//             </div>
//           )}
          
//           <div className="flex gap-3">
//             <button
//               onClick={handleAction}
//               disabled={isProcessing}
//               className="flex-1 bg-[#e6ce04] text-[#010200] font-bold py-2 rounded-lg hover:bg-[#f8e555] disabled:opacity-50"
//             >
//               {isProcessing ? 'Processing...' : config.buttonText}
//             </button>
//             <button
//               onClick={() => setActiveAction(null)}
//               disabled={isProcessing}
//               className="px-4 py-2 border border-[#e6ce04]/30 rounded-lg text-[#e6ce04] hover:bg-[#1a1a18]"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <main className="min-h-screen pt-4 pb-16 bg-[#010200]">
//       <ActionModal />

//       <div className="container mx-auto px-4">
//         {/* Header */}
//         <div className="flex items-center mb-8">
//             <button 
//               onClick={() => router.push('/app/pools')}
//             className="mr-4 p-2 rounded-full hover:bg-[#1a1a18] text-[#e6ce04]"
//             >
//             <ArrowLeft size={24} />
//             </button>
//           <div className="flex-1">
//             <div className="flex items-center gap-3">
//               <div className="w-12 h-12 bg-[#e6ce04] rounded-full flex items-center justify-center">
//                 <Coins className="w-6 h-6 text-[#010200]" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-[#e6ce04]">HuiFi Pool #{MOCK_POOL_DATA.id}</h1>
//                 <p className="text-[#f8e555]/70">Created by {MOCK_POOL_DATA.security.creator}</p>
//             </div>
//                 </div>
//               </div>
//           <div className="hidden md:block">
//             <div className="bg-[#1a1a18] px-4 py-2 rounded-lg border border-[#e6ce04]/20">
//               <span className="text-[#f8e555]/70 mr-2">Pool Status:</span>
//               <span className="text-[#e6ce04] font-bold">{MOCK_POOL_DATA.status}</span>
//           </div>
//           </div>
//         </div>

//         {/* Main content */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left column */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Stats Grid */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
//                 <p className="text-[#f8e555]/70 text-base mb-1">Total Value</p>
//                 <p className="text-2xl font-bold text-[#e6ce04]">{MOCK_POOL_DATA.totalValue}</p>
//               </div>
//               <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
//                 <p className="text-[#f8e555]/70 text-base mb-1">APY</p>
//                 <p className="text-2xl font-bold text-[#e6ce04]">{MOCK_POOL_DATA.financials.apy}</p>
//               </div>
//               <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
//                 <p className="text-[#f8e555]/70 text-base mb-1">Members</p>
//                 <p className="text-2xl font-bold text-[#e6ce04]">{MOCK_POOL_DATA.participants.current}/{MOCK_POOL_DATA.participants.max}</p>
//               </div>
//               <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
//                 <p className="text-[#f8e555]/70 text-base mb-1">Round</p>
//                 <p className="text-2xl font-bold text-[#e6ce04]">{MOCK_POOL_DATA.rounds.current}/{MOCK_POOL_DATA.rounds.total}</p>
//               </div>
//               </div>

//               {/* Tabs */}
//             <div className="bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20">
//               <div className="border-b border-[#e6ce04]/20">
//                 <nav className="flex space-x-4 px-4" aria-label="Tabs">
//                   {['overview', 'members', 'history', 'details'].map((tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab)}
//                       className={`py-3 px-4 text-base font-medium border-b-2 ${
//                         activeTab === tab
//                           ? 'border-[#e6ce04] text-[#e6ce04]'
//                           : 'border-transparent text-[#f8e555]/70 hover:text-[#e6ce04]'
//                       }`}
//                     >
//                       {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               <div className="p-6">
//                 {activeTab === 'overview' && (
//                   <div className="space-y-6">
//                     <div className="grid grid-cols-2 gap-6">
//                       <div>
//                         <h3 className="text-xl font-medium text-[#e6ce04] mb-3">Pool Information</h3>
//                         <div className="space-y-3 text-base">
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Status</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.status}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Frequency</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.timing.frequency}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Round Duration</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.timing.roundDuration}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Total Rounds</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.rounds.total}</span>
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-medium text-[#e6ce04] mb-3">Financial Details</h3>
//                         <div className="space-y-3 text-base">
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Entry Amount</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.financials.contributionAmount}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Total Contributed</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.financials.totalContributed}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Yield Earned</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.financials.yieldEarned}</span>
//                           </p>
//                           <p className="flex justify-between">
//                             <span className="text-[#f8e555]/70">Early Withdrawal Fee</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.financials.earlyWithdrawalFee}</span>
//                           </p>
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <h3 className="text-xl font-medium text-[#e6ce04] mb-3">Your Position</h3>
//                       <div className="bg-[#010200] rounded-lg p-4 border border-[#e6ce04]/20">
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
//                           <div>
//                             <p className="text-[#f8e555]/70 mb-1">Position</p>
//                             <p className="text-lg font-medium text-[#e6ce04]">#{MOCK_POOL_DATA.user.position}</p>
//                           </div>
//                           <div>
//                             <p className="text-[#f8e555]/70 mb-1">Rounds to Wait</p>
//                             <p className="text-lg font-medium text-[#e6ce04]">{MOCK_POOL_DATA.user.roundsToWait}</p>
//                           </div>
//                           <div>
//                             <p className="text-[#f8e555]/70 mb-1">Contributed</p>
//                             <p className="text-lg font-medium text-[#e6ce04]">{MOCK_POOL_DATA.user.contributed}</p>
//                           </div>
//                           <div>
//                             <p className="text-[#f8e555]/70 mb-1">Earned</p>
//                             <p className="text-lg font-medium text-[#e6ce04]">{MOCK_POOL_DATA.user.earned}</p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {activeTab === 'members' && (
//                   <div className="space-y-4">
//                     {Array.from({ length: MOCK_POOL_DATA.participants.current }).map((_, index) => (
//                       <div key={index} className="flex items-center justify-between bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center">
//                             <Users className="w-4 h-4 text-[#e6ce04]" />
//                           </div>
//                   <div>
//                             <p className="text-[#e6ce04]">Member #{index + 1}</p>
//                             <p className="text-sm text-[#f8e555]/70">Joined {MOCK_POOL_DATA.dates.started}</p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <p className="text-[#e6ce04]">{MOCK_POOL_DATA.financials.contributionAmount}</p>
//                           <p className="text-sm text-[#f8e555]/70">Contributed</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {activeTab === 'history' && (
//                   <div className="space-y-4">
//                     {MOCK_POOL_DATA.history.map((event, index) => (
//                       <div key={index} className="flex items-center justify-between bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center">
//                             <History className="w-4 h-4 text-[#e6ce04]" />
//                           </div>
//                   <div>
//                             <p className="text-[#e6ce04]">{event.type}</p>
//                             <p className="text-sm text-[#f8e555]/70">{event.date}</p>
//                           </div>
//                         </div>
//                         {event.amount && (
//                           <div className="text-right">
//                             <p className="text-[#e6ce04]">{event.amount}</p>
//                             <p className="text-sm text-[#f8e555]/70">{event.recipient}</p>
//                             </div>
//                         )}
//                             </div>
//                         ))}
//                   </div>
//                 )}

//                 {activeTab === 'details' && (
//                   <div className="space-y-6">
//                     <div>
//                       <h3 className="text-xl font-medium text-[#e6ce04] mb-3">Pool Statistics</h3>
//                       <div className="grid grid-cols-2 gap-4 text-base">
//                         <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                           <p className="text-[#f8e555]/70 mb-1">Total Members</p>
//                           <p className="text-[#e6ce04] font-medium">{MOCK_POOL_DATA.stats.totalMembers}</p>
//                         </div>
//                         <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                           <p className="text-[#f8e555]/70 mb-1">Total Payouts</p>
//                           <p className="text-[#e6ce04] font-medium">{MOCK_POOL_DATA.stats.totalPayouts}</p>
//                         </div>
//                         <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                           <p className="text-[#f8e555]/70 mb-1">Average Yield</p>
//                           <p className="text-[#e6ce04] font-medium">{MOCK_POOL_DATA.stats.averageYield}</p>
//                         </div>
//                         <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
//                           <p className="text-[#f8e555]/70 mb-1">Completed Rounds</p>
//                           <p className="text-[#e6ce04] font-medium">{MOCK_POOL_DATA.stats.completedRounds}</p>
//                         </div>
//                       </div>
//                     </div>

//                   <div>
//                       <h3 className="text-xl font-medium text-[#e6ce04] mb-3">Security Information</h3>
//                       <div className="bg-[#010200] p-4 rounded-lg border border-[#e6ce04]/20">
//                         <div className="space-y-3 text-base">
//                           <div className="flex items-center justify-between">
//                             <span className="text-[#f8e555]/70">Contract Address</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.security.contract}</span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-[#f8e555]/70">Creator</span>
//                             <span className="text-[#e6ce04]">{MOCK_POOL_DATA.security.creator}</span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-[#f8e555]/70">Verified</span>
//                             <span className="text-[#e6ce04]">
//                               {MOCK_POOL_DATA.security.verified ? 'Yes' : 'No'}
//                             </span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-[#f8e555]/70">Audited</span>
//                             <span className="text-[#e6ce04]">
//                               {MOCK_POOL_DATA.security.audited ? 'Yes' : 'No'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right column */}
//           <div className="space-y-6">
//             {/* Timer Card */}
//             <div className="bg-[#1a1a18] rounded-xl p-6 border border-[#e6ce04]/20">
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-[#e6ce04] mb-2">Next Payout In</h3>
//                   <p className="text-4xl font-mono font-bold text-[#e6ce04] mb-3">
//                   {MOCK_POOL_DATA.timing.nextPayoutIn}
//                 </p>
//                 <p className="text-base text-[#f8e555]/70">
//                   Your position: #{MOCK_POOL_DATA.user.position}
//                 </p>
//               </div>
//             </div>

//             {/* Pool Stats */}
//             <div className="bg-[#1a1a18] rounded-xl p-6 border border-[#e6ce04]/20">
//               <h3 className="text-xl font-bold text-[#e6ce04] mb-4">Your Stats</h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center text-base">
//                   <span className="text-[#f8e555]/70">Contributed</span>
//                   <span className="text-[#e6ce04] font-bold text-lg">{MOCK_POOL_DATA.user.contributed}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-base">
//                   <span className="text-[#f8e555]/70">Earned</span>
//                   <span className="text-[#e6ce04] font-bold text-lg">{MOCK_POOL_DATA.user.earned}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-base">
//                   <span className="text-[#f8e555]/70">Status</span>
//                   <span className="text-[#e6ce04] font-bold text-lg">{MOCK_POOL_DATA.user.status}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Full-width Action Buttons with Progress Pool button for creator */}
//         <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
//           <button
//             onClick={() => setActiveAction('bid')}
//             className="w-full bg-[#e6ce04] text-[#010200] py-5 px-6 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-xl"
//           >
//             <Zap className="w-7 h-7 mr-2" />
//             Place Bid
//           </button>
          
//           <button
//             onClick={() => setActiveAction('contribute')}
//             className="w-full bg-[#e6ce04] text-[#010200] py-5 px-6 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-xl"
//           >
//             <Coins className="w-7 h-7 mr-2" />
//             Contribute
//           </button>
          
//           <button
//             onClick={() => setActiveAction('withdraw')}
//             className="w-full bg-[#e6ce04] text-[#010200] py-5 px-6 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-xl"
//           >
//             <Wallet className="w-7 h-7 mr-2" />
//             Withdraw
//           </button>
          
//           <button
//             onClick={() => setActiveAction('claim')}
//             className="w-full bg-[#e6ce04] text-[#010200] py-5 px-6 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-xl"
//           >
//             <Trophy className="w-7 h-7 mr-2" />
//             Claim Payout
//           </button>
//         </div>

//         {/* Progress Pool Button - For Pool Creator Only */}
//         <div className="mt-12 flex justify-center items-center w-full">
//           <div className="text-center max-w-md mx-auto">
//             <p className="text-base text-white mb-3 font-medium">Pool Creator Controls</p>
//             <button
//               onClick={() => setActiveAction('progress')}
//               className="bg-red-600 hover:bg-red-700 text-white py-5 px-10 rounded-lg flex items-center justify-center font-bold text-xl w-full"
//             >
//               Progress Pool
//               <ArrowRight className="w-6 h-6 ml-2" />
//             </button>
//             <p className="text-sm text-gray-400 mt-3">Only the pool creator can progress the pool</p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default PoolDetailPage;

// app/src/app/app/pools/[id]/page.tsx
import { PublicKey } from '@solana/web3.js';
import { PoolDetailComponent } from '@/components/PoolDetailComponent';

export default function PoolDetailPage({ params }: { params: { id: string } }) {
  try {
    const publicKey = new PublicKey(params.id);
    return <PoolDetailComponent publicKey={publicKey.toString()} initialData={null} />;
  } catch (error) {
    return <div>Error: Invalid Pool ID format provided.</div>;
  }
}