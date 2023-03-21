const monerojs = require('monero-javascript')

exports.transfer = async (toAddress, amount) => {
  const daemon = await monerojs.connectToDaemonRpc(
    'https://testnet.xmr.ditatompel.com:443',
    'superuser',
    'abctesting123'
  )
  const walletRpc = await monerojs.connectToWalletRpc(
    'http://localhost:28084',
    'rpc_user',
    'abc123'
  ) // Connect to a Monero daemon

  // Get transaction by transaction ID
  const txId =
    'af07bbfed04185502fb28e241bbaf63c62385dac484cf901e774bc35cf7ada7f'
  const tx = await daemon.getTx(txId)
  console.log({ tx })

  // Get the current block height
  const currentHeight = await daemon.getHeight()

  console.log(tx.getNumConfirmations())
  // Calculate the number of confirms for the transaction
  const confirms =
    currentHeight -
    tx
      .getBlock()
      .getHeader()
      .getHeight() +
    1
  console.log({ confirms })
  return ''

  // try {
  //   await walletRpc.openWallet('nurev2', 'password')
  // } catch (e) {
  //   console.log(e)
  //   return 'fail'
  // }
  // try {
  //   const primaryAddress = await walletRpc.getPrimaryAddress() // 555zgduFhmKd2o8rPUz...
  // } catch (e) {
  // } finally {
  //   await walletRpc.close()
  // }
  // return ''
  // const balance = await walletRpc.getBalance() // 533648366742
  // // let txs = await walletRpc.getTxs();

  // const createdTx = await walletRpc.createTx({
  //   accountIndex: 0,
  //   address: toAddress,
  //   amount: new monerojs.BigInteger(String(amount)), // amount to transfer in atomic units
  //   relay: false // create transaction and relay to the network if true
  // })
  // const fee = createdTx.getFee() // "Are you sure you want to send... ?"
  // await walletRpc.relayTx(createdTx) // relay the transaction

  // utils.handleSuccess(res, 201, {
  //   primaryAddress,
  //   mnemonic,
  //   balance,
  //   createdTx
  // })
}
