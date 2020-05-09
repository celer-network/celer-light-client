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

export function createTokenInfo(
  tokenType: TokenTypeMap[keyof TokenTypeMap],
  tokenAddress: string
) {
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
