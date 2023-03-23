const monerojs = require('monero-javascript')

const monero = {}

const initMonero = async () => {
  console.log('===== START MONERO SETUP ===== ')
  const serverUri =
    process.env.NODE_ENV === 'production'
      ? 'xmr.opensrc.one:18081'
      : 'https://testnet.xmr.ditatompel.com:443'
  const networkType =
    process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
  const mnemonic = process.env.MNEMONIC_PHRASE
  const password = process.env.WALLET_PASSWORD

  monero.daemon = await monerojs.connectToDaemonRpc(serverUri)
  console.log('Opening Wallet...')

  monero.walletFull = await monerojs.createWalletFull({
    password,
    networkType,
    serverUri,
    mnemonic,
    restoreHeight: 2198800
  })
  // synchronize with progress notifications
  // await monero.walletFull.sync(
  //   new (class extends monerojs.MoneroWalletListener {
  //     onSyncProgress(height, startHeight, endHeight, percentDone, message) {
  //       // feed a progress bar?
  //       console.log(...arguments)
  //     }
  //   })()
  // )
  console.log('Syncing wallet...')

  // synchronize in the background
  await monero.walletFull.startSyncing()

  // monero.walletRpc = await monerojs.connectToWalletRpc(
  //   'http://localhost:28084',
  //   'rpc_user',
  //   'abc123'
  // )
  console.log('Syncing finished')

  const afterBalance = await monero.walletFull.getBalance()
  console.log({ afterBalance })

  // try {
  //   console.log('Opening wallet...')
  //   await monero.walletRpc.openWallet('nurev2', 'password')
  // } catch (e) {
  //   console.log('Already opened. Closing current wallet...')
  //   await monero.walletRpc.close()
  //   await monero.walletRpc.openWallet('nurev2', 'password')
  // } finally {
  //   console.log('Wallet opened')
  // }
}

module.exports = {
  initMonero,
  monero
}
