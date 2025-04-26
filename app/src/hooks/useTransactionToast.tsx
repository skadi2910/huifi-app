import toast from 'react-hot-toast';
import { XCircle, CheckCircle } from 'lucide-react';

export const useTransactionToast = () => {
  const transactionToast = (signature: string, message: string = 'Transaction successful') => {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1a1a18] border-l-4 border-green-500 shadow-lg rounded-lg pointer-events-auto flex`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-400">Success</p>
                <p className="mt-1 text-sm text-green-300">{message}</p>
                <a 
                  href={`https://solscan.io/tx/${signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-green-400 hover:text-green-300 underline"
                >
                  View on Solscan
                </a>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  transactionToast.error = (message: string) => {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1a1a18] border-l-4 border-red-500 shadow-lg rounded-lg pointer-events-auto flex`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="mt-1 text-sm text-red-300">{message}</p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  return transactionToast;
};