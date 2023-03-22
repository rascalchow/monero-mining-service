const monerojs = require('monero-javascript')

const monero = {}
const initMonero = async () => {
  console.log('===== START MONERO SETUP ===== ')
  monero.daemon = await monerojs.connectToDaemonRpc(
    'https://testnet.xmr.ditatompel.com:443',
    'superuser',
    'abctesting123'
  )

  console.log('Opening Wallet...')

  monero.walletFull = await monerojs.createWalletFull({
    password: 'supersecretpassword123',
    networkType: 'testnet',
    serverUri: 'http://testnet.xmr-tw.org:28081',
    mnemonic:
      'atrium fading losing husband pencil quick awful adept rural bids wizard cavernous tedious nabbing soggy wetsuit royal awful sixteen whipped spying imagine vibrate zinger awful',
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
