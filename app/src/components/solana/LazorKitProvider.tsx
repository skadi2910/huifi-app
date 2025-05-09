'use client';

import React, { ReactNode } from 'react';

type LazorKitProviderProps = {
  children: ReactNode;
};

export function LazorKitProvider({ children }: LazorKitProviderProps) {
  // The @lazorkit/wallet doesn't need an explicit provider as it uses React Context internally
  // We're creating this component to mirror the structure of SolanaProvider but it simply passes children through
  return <>{children}</>;
}