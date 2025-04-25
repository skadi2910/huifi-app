export const mapProgramError = (error: Error): string => {
  const errorMessage = error.message;
  
  if (errorMessage.includes('NotWhitelisted')) {
    return 'You are not whitelisted for this pool';
  }
  if (errorMessage.includes('InsufficientCollateral')) {
    return 'Insufficient collateral for early payout';
  }
  if (errorMessage.includes('AlreadyReceivedPayout')) {
    return 'You have already received a payout';
  }
  if (errorMessage.includes('NotEligibleForPayout')) {
    return 'You are not eligible for payout yet';
  }
  if (errorMessage.includes('InsufficientPoolFunds')) {
    return 'Pool has insufficient funds';
  }
  if (errorMessage.includes('InvalidPoolUuid')) {
    return 'Invalid pool identifier';
  }
  if (errorMessage.includes('InvalidPoolType')) {
    return 'Invalid pool type';
  }
  if (errorMessage.includes('InsufficientCollateralAmount')) {
    return 'Insufficient collateral amount';
  }
  if (errorMessage.includes('WhitelistTooLarge')) {
    return 'Whitelist is too large';
  }
  
  // ... existing error mappings ...
  
  return 'An unknown error occurred';
}; 