export function generateRandomUUID(length: number): Uint8Array {
    return new Uint8Array(length).map(() => Math.floor(Math.random() * 256));
}