import Dexie from 'dexie';
import { ethers } from 'ethers';

import { Celer, TokenType } from '../src/index';
import config from './config.json';

(async () => {
  //Dexie.delete('CelerDatabase');
  const client = await Celer.create(config);
  const channelId = await client.openPaymentChannel(
    TokenType.ETH,
    ethers.constants.AddressZero,
    '100',
    '100'
  );
  console.log('Channel', channelId, 'opened');
  const paymentId = await client.sendPayment(
    TokenType.ETH,
    ethers.constants.AddressZero,
    '1',
    config.ospEthAddress
  );
  console.log('Payment', paymentId, 'sent');
})();
