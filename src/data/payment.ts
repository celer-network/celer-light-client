import { ethers } from 'ethers';
import { Message } from 'google-protobuf';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { ConditionalPay, PayIdList } from '../protobufs/entity_pb';

export enum PaymentStatus {
  INITIAL = 0,
  PEER_FROM_SIGNED_PENDING = 1,
  CO_SIGNED_PENDING = 2,
  HASH_LOCK_REVEALED = 3,
  PEER_FROM_SIGNED_SETTLED = 4,
  CO_SIGNED_SETTLED = 5,
  EXPIRED = 6,
  FAILED = 7,
}

export class Payment {
  readonly paymentId: string;
  readonly incomingChannelId: string;
  readonly outgoingChannelId: string;
  private readonly note: Uint8Array; // Any
  private readonly conditionalPay: Uint8Array; // ConditionalPay

  status: PaymentStatus;
  settlementAmount: Uint8Array; // BigNumber

  constructor(
    paymentId: string,
    conditionalPay: ConditionalPay,
    incomingChannelId: string,
    outgoingChannelId: string,
    note?: Any
  ) {
    this.paymentId = paymentId;
    this.conditionalPay = conditionalPay.serializeBinary();
    this.status = PaymentStatus.INITIAL;
    this.incomingChannelId = incomingChannelId;
    this.outgoingChannelId = outgoingChannelId;
    if (note) {
      this.note = note.serializeBinary();
    }
  }

  getConditionalPay(): ConditionalPay {
    return ConditionalPay.deserializeBinary(this.conditionalPay);
  }

  getNote(): Any {
    return Any.deserializeBinary(this.note);
  }

  static calculatePaymentId(payment: ConditionalPay): string {
    const paymentBytes = payment.serializeBinary();
    const paymentHash = ethers.utils.arrayify(
      ethers.utils.keccak256(paymentBytes)
    );
    const resolver = payment.getPayResolver_asU8();
    const packed = new Uint8Array(paymentHash.length + resolver.length);
    packed.set(paymentHash);
    packed.set(resolver, paymentHash.length);
    return ethers.utils.keccak256(packed);
  }

  static getPaymentIdListDifferences(
    a: PayIdList,
    b: PayIdList
  ): [Uint8Array[], Uint8Array[]] {
    const aAsArrays = a.getPayIdsList_asU8();
    const aAsStrings = a.getPayIdsList_asB64();
    const bAsArrays = b.getPayIdsList_asU8();
    const bAsStrings = b.getPayIdsList_asB64();
    return Payment.getListDifferences(
      aAsArrays,
      aAsStrings,
      bAsArrays,
      bAsStrings
    );
  }

  static getUint8ArrayListDifferences(
    aAsArrays: Uint8Array[],
    bAsArrays: Uint8Array[]
  ): [Uint8Array[], Uint8Array[]] {
    const aAsStrings = Message.bytesListAsB64(aAsArrays);
    const bAsStrings = Message.bytesListAsB64(bAsArrays);
    return Payment.getListDifferences(
      aAsArrays,
      aAsStrings,
      bAsArrays,
      bAsStrings
    );
  }

  private static getListDifferences(
    aAsArrays: Uint8Array[],
    aAsStrings: string[],
    bAsArrays: Uint8Array[],
    bAsStrings: string[]
  ): [Uint8Array[], Uint8Array[]] {
    const onlyInA = aAsArrays.filter(
      (_, i) => !bAsStrings.includes(aAsStrings[i])
    );
    const onlyInB = bAsArrays.filter(
      (_, i) => !aAsStrings.includes(bAsStrings[i])
    );
    return [onlyInA, onlyInB];
  }
}
