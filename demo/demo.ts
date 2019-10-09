import { ethers } from 'ethers';

import { Celer, PaymentStatus, TokenType } from '../src/index';
import config from './ropsten_config.json';

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
  window.client
    .getPaymentChannelInfo(window.channelId)
    .then(
      info =>
        (document.getElementById('balance').textContent = JSON.stringify(
          info.balance
        ))
    );
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
  let paymentId: string;
  client
    .sendPayment(
      TokenType.ETH,
      ethers.constants.AddressZero,
      (document.getElementById('recipient') as HTMLInputElement).value,
      '1'
    )
    .then(id => {
      paymentId = id;
      document.getElementById(
        'payment'
      ).textContent = `Payment ${paymentId} sent`;
      const balanceUpdate = setInterval(() => {
        client
          .getPaymentInfo(paymentId)
          .then(info => {
            if (info.status === PaymentStatus.CO_SIGNED_SETTLED) {
              updateBalance();
              clearInterval(balanceUpdate);
            }
          })
          .catch(_ => {});
      }, 1000);
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
  const provider = new ethers.providers.Web3Provider(
    window['ethereum'] || window.web3.currentProvider
  );
  const client = await Celer.create(config, provider);
  window.client = client;
})();

window.openChannel = openChannel;
window.deposit = deposit;
window.sendPayment = sendPayment;
window.updateBalance = updateBalance;
