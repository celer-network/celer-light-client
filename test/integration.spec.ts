import Dexie from 'dexie';
import { ethers } from 'ethers';
import indexedDB from 'fake-indexeddb';

import config from '../demo/local_config.json';
import contractsInfo from '../demo/local_contracts.json';
import { Celer, TokenType } from '../src/index';

Dexie.dependencies.indexedDB = indexedDB;

it('should open channel', async () => {
  const client = await Celer.create(
    'http://localhost:8545',
    2,
    contractsInfo,
    config
  );
  const channelId = await client.openPaymentChannel(
    TokenType.ETH,
    ethers.constants.AddressZero,
    '1',
    '1'
  );
  expect(channelId).toBeDefined();
  client.close();
});
