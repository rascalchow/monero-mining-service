const {
  STEALTHEX: { API_KEY, BASE_URL }
} = require('../consts')
const axios = require('axios')
const monerojs = require('monero-javascript')
const { MoneroNetworkType } = monerojs

const get = async (uri, query) => {
  const { data: response } = await axios.get(BASE_URL + uri, {
    params: { api_key: API_KEY, ...query }
  })
  return response
}
const post = async (uri, body) => {
  return await axios.post(BASE_URL + uri, body, {
    params: { api_key: API_KEY }
  })
}

exports.moneroTransfer = async (toAddress, amount) => {
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

/**
 * Process Block Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.availableCurrenciesWithXMR = async () => {
  return await get('pairs/xmr')
}

exports.transfer = async (address, currency, amount) => {
  const exchange = await post('exchange', {
    currency_from: 'xmr', // Monero token
    currency_to: currency,
    address_to: address,
    amount_from: amount
  })
  if (amount !== exchange.expected_amount) {
    throw new Error('Something went wrong!')
  }
  // transfer from process.env.MONERO_MINER_WALLET to exchange.address_from
}

exports.estimateExchange = async (from, to, amount) => {
  const response = await get(`estimate/${from}/${to}`, { amount })
  return response?.estimated_amount || 0
}
