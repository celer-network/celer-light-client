import Dexie from 'dexie';
import { ethers } from 'ethers';
import indexedDB from 'fake-indexeddb';

import config from '../demo/local_config.json';
import contractsInfo from '../demo/local_contracts.json';
import { Celer, TokenType } from '../src/index';

Dexie.dependencies.indexedDB = indexedDB;

const connection = 'http://127.0.0.1:8545';

it('should open channel', async () => {
  const provider = new ethers.providers.JsonRpcProvider(connection);
  expect(await provider.getSigner(2).unlock('')).toBeTruthy();
  const client = await Celer.create(connection, 2, contractsInfo, config);
  const channelId = await client.openPaymentChannel(
    TokenType.ETH,
    ethers.constants.AddressZero,
    '1000000000000',
    '1000000000000'
  );
  expect(channelId).toBeDefined();
  client.close();
});
