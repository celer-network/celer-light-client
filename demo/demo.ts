import { ethers } from 'ethers';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { ContractsInfo } from '../src/api/contracts_info';
import { Celer, Config, PaymentStatus, TokenType } from '../src/index';
import { Invoice } from '../src/protobufs/invoice_pb';
import localConfig from './local_config.json';
import localContractsInfo from './local_contracts.json';
import ropstenConfig from './ropsten_config.json';
import ropstenContractsInfo from './ropsten_contracts.json';

declare global {
  interface Window {
    ethereum: { enable: Function; autoRefreshOnNetworkChange: boolean };
    web3: { currentProvider: object };
    client: Celer;
    channelId: string;
    redirectUrl: string;
    connect: Function;
    openChannel: Function;
    deposit: Function;
    sendPayment: Function;
    updateBalance: Function;
  }
}

async function updateBalance(): Promise<void> {
  if (window.channelId) {
    const paymentChannelInfo = await window.client.getPaymentChannelInfo(
      window.channelId
    );
    document.getElementById('balance').textContent = JSON.stringify(
      paymentChannelInfo.balance
    );
  }
}

async function openChannel(): Promise<void> {
  const channelId = await window.client.openPaymentChannel(
    TokenType.ETH,
    ethers.constants.AddressZero,
    '50000000000000000',
    '50000000000000000'
  );
  document.getElementById(
    'channel'
  ).textContent = `Channel ${channelId} opened`;
  window.channelId = channelId;
}

async function deposit(): Promise<void> {
  const _ = await window.client.deposit(window.channelId, TokenType.ETH, '100');
  document.getElementById('deposit').textContent = `Deposited 100 wei`;
}

async function sendPayment(): Promise<void> {
  const client = window.client;
  const amount = (document.getElementById('amount') as HTMLInputElement).value;
  const note = new Any();
  const invoice = new Invoice();
  invoice.setMemo(
    (document.getElementById('invoice') as HTMLInputElement).value
  );
  note.pack(invoice.serializeBinary(), 'invoice.Invoice');
  const paymentId = await client.sendPayment(
    TokenType.ETH,
    ethers.constants.AddressZero,
    (document.getElementById('recipient') as HTMLInputElement).value,
    amount,
    note
  );
  document.getElementById('payment').textContent = `Payment ${paymentId} sent`;
  const check = setInterval(async () => {
    const paymentInfo = await client.getPaymentInfo(paymentId);
    if (paymentInfo.status === PaymentStatus.CO_SIGNED_SETTLED) {
      clearInterval(check);
      if (window.redirectUrl) {
        window.location.href = window.redirectUrl;
      }
    }
  }, 1000);
}

async function connect() {
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

  let config: Config;
  let contractsInfo: ContractsInfo;
  const network = await provider.getNetwork();
  switch (network.name) {
    case 'ropsten':
      config = ropstenConfig;
      contractsInfo = ropstenContractsInfo;
    default:
      config = localConfig;
      contractsInfo = localContractsInfo;
  }

  // Note: For using with a keystore JSON:
  // const wallet = await Wallet.fromEncryptedJson('', '');
  // const client = await Celer.create(
  //   'http://localhost:8545',
  //   wallet,
  //   contractsInfo,
  //   config
  // );

  const client = await Celer.create(
    provider,
    provider.getSigner(),
    contractsInfo,
    config
  );

  setInterval(() => {
    updateBalance();
  }, 1000);

  window.client = client;
}

(async () => {
  const href = window.location.href;
  const url = new URL(href);
  const invoice = url.searchParams.get('invoice');
  const recipient = url.searchParams.get('recipient');
  const amount = url.searchParams.get('amount');
  const redirectUrl = url.searchParams.get('redirect');
  window.redirectUrl = redirectUrl;

  window.onload = () => {
    (document.getElementById(
      'recipient'
    ) as HTMLInputElement).value = recipient;
    (document.getElementById('amount') as HTMLInputElement).value = amount;
    (document.getElementById('invoice') as HTMLInputElement).value = invoice;
  };
})();

window.connect = connect;
window.openChannel = openChannel;
window.deposit = deposit;
window.sendPayment = sendPayment;
window.updateBalance = updateBalance;
