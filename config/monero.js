const monerojs = require('monero-javascript')

const monero = {}
const initMonero = async () => {
  console.log('===== START MONERO SETUP ===== ')
  monero.daemon = await monerojs.connectToDaemonRpc(
    'https://testnet.xmr.ditatompel.com:443',
    'superuser',
    'abctesting123'
  )
  monero.walletRpc = await monerojs.connectToWalletRpc(
    'http://localhost:28084',
    'rpc_user',
    'abc123'
  )
  try {
    console.log('Opening wallet...')
    await monero.walletRpc.openWallet('nurev2', 'password')
  } catch (e) {
    console.log('Already opened. Closing current wallet...')
    await monero.walletRpc.close()
    await monero.walletRpc.openWallet('nurev2', 'password')
  } finally {
    console.log('Wallet opened')
  }
}

module.exports = {
  initMonero,
  monero
}
