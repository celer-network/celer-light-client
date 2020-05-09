import { SimplexPaymentChannel } from '../protobufs/entity_pb';
import { SignedSimplexState } from '../protobufs/message_pb';
import * as errorUtils from '../utils/errors';
import { Database } from './database';
import { PaymentChannel } from './payment_channel';

export class PaymentChannelUtils {
  static async verifyIncomingChannelExistence(
    db: Database,
    receivedChannelId: string
  ): Promise<{
    readonly result: errorUtils.VerificationResult;
    readonly channel?: PaymentChannel;
    readonly storedSignedSimplexState?: SignedSimplexState;
    readonly storedSimplexState?: SimplexPaymentChannel;
  }> {
    const channel = await db.paymentChannels.get(receivedChannelId);
    if (!channel) {
      return {
        result: {
          valid: false,
          errReason: errorUtils.unknownChannel(receivedChannelId).message,
        },
      };
    }
    const storedSignedSimplexState = channel.getIncomingSignedSimplexState();
    const storedSimplexState = SimplexPaymentChannel.deserializeBinary(
      storedSignedSimplexState.getSimplexState_asU8()
    );
    return {
      result: { valid: true },
      channel,
      storedSignedSimplexState,
      storedSimplexState,
    };
  }
}
