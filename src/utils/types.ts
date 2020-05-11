import { ethers } from 'ethers';

import { TokenInfo, TokenTypeMap } from '../protobufs/entity_pb';

export function isAddress(address: string): boolean {
  try {
    ethers.utils.getAddress(address);
  } catch (_) {
    return false;
  }
  return true;
}

export function bytesToAddress(bytes: Uint8Array): string {
  return ethers.utils.getAddress(ethers.utils.hexlify(bytes));
}

export function numberToBytes(number: number): Uint8Array {
  return ethers.utils.arrayify(ethers.utils.bigNumberify(number));
}

export function createTokenInfo(
  tokenType: TokenTypeMap[keyof TokenTypeMap],
  tokenAddress: string
): TokenInfo {
  const tokenInfo = new TokenInfo();
  tokenInfo.setTokenType(tokenType);
  tokenInfo.setTokenAddress(
    ethers.utils.arrayify(ethers.utils.getAddress(tokenAddress))
  );
  return tokenInfo;
}

export function sortSignatureList(
  selfAddress: string,
  peerAddress: string,
  selfSignature: Uint8Array,
  peerSignature: Uint8Array
): Uint8Array[] {
  if (selfAddress < peerAddress) {
    return [selfSignature, peerSignature];
  }
  return [peerSignature, selfSignature];
}

export const ZERO_BYTES = numberToBytes(0);
