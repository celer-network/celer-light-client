# Celer Light Client

This is a TypeScript implementation of a Celer client capable of sending and
receiving conditional payments via state channels. Compared to a full Celer
node, the light client does NOT have the capability of relaying payments.

## API docs

Auto-generated API docs are available [here](https://celer-network.github.io/celer-light-client/index.html).
The APIs on the client object are listed [here](https://celer-network.github.io/celer-light-client/classes/_api_celer_.celer.html).

## Try it out

1. Make sure you have MetaMask installed on your browser and you are on the
   **Ropsten** testnet.
2. Check out the repo.
3. Run `yarn install`.
4. Run `yarn demo`.
5. A demo page will be available at `localhost:1234`. It is a bare-bone static
   page that implements a simple off-chain wallet.
6. Click "Connect Celer wallet" and sign **one** pop-up message.
7. Click "Open channel", sign **one** pop-up message, sign **one** transaction,
   and sign **two** pop-up messages after the transaction is mined.

Now you are free to send payments to a recipient that has also opened a channel,
or you can send to the Celer Community OSP :)

The [code](https://github.com/celer-network/celer-light-client/blob/master/demo/demo.ts)
is pretty self-explanatory.
