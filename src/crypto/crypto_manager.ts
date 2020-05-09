import { ethers, Signer } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

export class CryptoManager {
  readonly provider: JsonRpcProvider;
  readonly signer: Signer;

  constructor(provider: JsonRpcProvider, signer: Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Similar to openzeppelin.ECDSA.toEthSignedMessageHash(). Following the
   * suggestions in
   * {@link https://medium.com/@yaoshiang/ethereums-ecrecover-openzeppelin-s-ecdsa-and-web3-s-sign-8ff8d16595e1}
   *
   * @param data The bytes to be signed
   */
  async signHash(data: Uint8Array): Promise<string> {
    const hash = ethers.utils.arrayify(ethers.utils.keccak256(data));
    const signature = await this.signer.signMessage(hash);
    return CryptoManager.joinSignature(ethers.utils.splitSignature(signature));
  }

  private static joinSignature(signature: ethers.utils.Signature): string {
    // Hack to use v: 00/01
    // TODO(dominator008): Remove once OSP accepts 27/28
    return ethers.utils.hexlify(
      ethers.utils.concat([
        signature.r,
        signature.s,
        signature.recoveryParam ? '0x1' : '0x0',
      ])
    );
  }

  static isSignatureValid(
    signer: string,
    data: Uint8Array,
    signature: ethers.utils.Signature
  ): boolean {
    return (
      ethers.utils.verifyMessage(
        ethers.utils.arrayify(ethers.utils.keccak256(data)),
        signature
      ) === signer
    );
  }
}
