export class HuifiError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'HuifiError';
  }
}

export const handleProgramError = (error: any) => {
  // Extract error code and message from Anchor error
  const match = error.message.match(/0x[0-9a-f]+/i);
  if (match) {
    const code = match[0];
    const message = mapProgramError(error);
    return new HuifiError(message, code);
  }
  return error;
}; 