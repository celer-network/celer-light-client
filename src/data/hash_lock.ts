export class HashLock {
  readonly secret: Uint8Array;
  readonly hash: string;

  constructor(secret: Uint8Array, hash: string) {
    this.secret = secret;
    this.hash = hash;
  }
}
