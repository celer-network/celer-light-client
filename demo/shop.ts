async function shop(amount: string) {
  const response = await fetch(
    'https://web-proxy.celer.app/merchant/generateinvoice',
    {
      method: 'POST'
    }
  );
  if (response) {
    const memo = (await response.json())['Memo'];
    window.location.href = `https://celer-network.github.io/celer-web-wallet/index.html?recipient=0x6fb7a37b3a8a2861eeb3e02e60b682dcd2d3c005&amount=${amount}&invoice=${memo}&redirect=https://celer-network.github.io/celer-web-wallet/shop.html?paid=${memo}`;
  }
}

async function check(paid: string) {
  const checker = setInterval(async () => {
    const response = await fetch(
      `https://web-proxy.celer.app/merchant/payment/${paid}`
    );
    if (response) {
      const json = await response.json();
      (document.getElementById(
        'paid'
      ) as HTMLInputElement).textContent = `Invoice ${paid} paid with payment ID ${json['paymentId']}`;
      clearInterval(checker);
    }
  }, 100);
}

(async () => {
  const href = window.location.href;
  const url = new URL(href);
  const paid = url.searchParams.get('paid');
  if (paid) {
    await check(paid);
  }
})();

window.shop = shop;
