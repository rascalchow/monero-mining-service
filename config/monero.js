const monerojs = require('monero-javascript')

let daemon
let walletRpc

const initMonero = async () => {
  daemon = await monerojs.connectToDaemonRpc(
    'https://testnet.xmr.ditatompel.com:443',
    'superuser',
    'abctesting123'
  )
  walletRpc = await monerojs.connectToWalletRpc(
    'http://localhost:28084',
    'rpc_user',
    'abc123'
  ) // Connect to a Monero daemon
}

module.exports = {
  initMonero,
  daemon,
  walletRpc
}
