export enum ProgramErrorCode {
  ProtocolFeeExceedsLimit = 'ProtocolFeeExceedsLimit',
  InvalidParticipantCount = 'InvalidParticipantCount',
  ContributionTooSmall = 'ContributionTooSmall',
  CycleDurationTooShort = 'CycleDurationTooShort',
  PoolNotAcceptingParticipants = 'PoolNotAcceptingParticipants',
  PoolFull = 'PoolFull',
  AlreadyParticipant = 'AlreadyParticipant',
  PoolNotActive = 'PoolNotActive',
  NotParticipant = 'NotParticipant',
  IncorrectContributionAmount = 'IncorrectContributionAmount',
  InvalidRound = 'InvalidRound',
  BidTooLow = 'BidTooLow',
  NotRoundWinner = 'NotRoundWinner',
  JackpotAlreadyClaimed = 'JackpotAlreadyClaimed',
  NotPoolCreator = 'NotPoolCreator',
  PoolStillActive = 'PoolStillActive',
  NotWhitelisted = 'NotWhitelisted',
  InsufficientCollateral = 'InsufficientCollateral',
  AlreadyReceivedPayout = 'AlreadyReceivedPayout',
  NotEligibleForPayout = 'NotEligibleForPayout',
  InsufficientPoolFunds = 'InsufficientPoolFunds',
  InvalidPoolUuid = 'InvalidPoolUuid',
  InvalidPoolType = 'InvalidPoolType',
  InsufficientCollateralAmount = 'InsufficientCollateralAmount',
  WhitelistTooLarge = 'WhitelistTooLarge',
}

export class ProgramError extends Error {
  constructor(
    public code: ProgramErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ProgramError';
  }
} 