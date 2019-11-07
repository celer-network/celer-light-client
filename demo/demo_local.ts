import { ethers, Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { Celer, TokenType } from '../src/index';
import { Invoice } from '../src/protobufs/invoice_pb';
import config from './local_config.json';
import contractsInfo from './local_contracts.json';

declare global {
  interface Window {
    ethereum: { enable: Function; autoRefreshOnNetworkChange: boolean };
    web3: { currentProvider: object };
    client: Celer;
    channelId: string;
    openChannel: Function;
    deposit: Function;
    sendPayment: Function;
    updateBalance: Function;
  }
}

function updateBalance(): void {
  if (window.channelId) {
    window.client
      .getPaymentChannelInfo(window.channelId)
      .then(
        info =>
          (document.getElementById('balance').textContent = JSON.stringify(
            info.balance
          ))
      )
      .catch();
  }
}

function openChannel(): void {
  window.client
    .openPaymentChannel(
      TokenType.ETH,
      ethers.constants.AddressZero,
      '50000000000000000',
      '50000000000000000'
    )
    .then(channelId => {
      document.getElementById(
        'channel'
      ).textContent = `Channel ${channelId} opened`;
      window.channelId = channelId;
    });
}

function deposit(): void {
  window.client.deposit(window.channelId, TokenType.ETH, '100').then(_ => {
    document.getElementById('deposit').textContent = `Deposited 100 wei`;
    updateBalance();
  });
}

function sendPayment(): void {
  const client = window.client;
  updateBalance();
  const note = new Any();
  const invoice = new Invoice();
  invoice.setMemo(
    (document.getElementById('invoice') as HTMLInputElement).value
  );
  note.pack(invoice.serializeBinary(), 'invoice.Invoice');
  let paymentId: string;
  client
    .sendPayment(
      TokenType.ETH,
      ethers.constants.AddressZero,
      (document.getElementById('recipient') as HTMLInputElement).value,
      '1',
      note
    )
    .then(id => {
      paymentId = id;
      document.getElementById(
        'payment'
      ).textContent = `Payment ${paymentId} sent`;
    });
}

(async () => {
  if (
    typeof window.ethereum === 'undefined' &&
    typeof window.web3 === 'undefined'
  ) {
    return;
  }
  if (window.ethereum) {
    window.ethereum.autoRefreshOnNetworkChange = false;
    await window.ethereum.enable();
  }
  // const provider = new ethers.providers.Web3Provider(
  //   window['ethereum'] || window.web3.currentProvider
  // );
  const wallet = await Wallet.fromEncryptedJson('', '');
  const client = await Celer.create(
    'http://localhost:8545',
    wallet,
    contractsInfo,
    config
  );

  setInterval(() => {
    updateBalance();
  }, 1000);

  window.client = client;
})();

window.openChannel = openChannel;
window.deposit = deposit;
window.sendPayment = sendPayment;
window.updateBalance = updateBalance;
