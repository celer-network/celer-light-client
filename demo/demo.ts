import Dexie from 'dexie';

import { Celer } from '../src/index';
import config from './config.json';

(async () => {
  //Dexie.delete('CelerDatabase');
  const client = await Celer.create(config);
  const channelId = await client.openEthChannel('100', '100');
  console.log('Channel', channelId, 'opened');
  const paymentId = await client.sendEth('1', config.ospEthAddress);
  console.log('Payment', paymentId, 'sent');
})();
