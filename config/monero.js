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
  )
  try {
    await walletRpc.getBalance()
    await walletRpc.close()
  } catch (e) {
  } finally {
    await walletRpc.openWallet('nurev2', 'password')
  }
}

module.exports = {
  initMonero,
  daemon,
  walletRpc
}
