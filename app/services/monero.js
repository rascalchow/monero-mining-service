const monerojs = require('monero-javascript')
const { monero } = require('../../config/monero')

exports.checkTransactionStatus = async txHash => {
  const tx = await monero.daemon.getTx(txHash)
  console.log({ tx })
  let status = 'initializing'
  let confirms = 0
  if (tx.inTxPool()) {
    status = 'inTxPool'
  }
  if (tx.isRelayed()) {
    status = 'relayed'
  }
  if (tx.isConfirmed()) {
    status = 'confirmed'
    confirms = tx.getNumConfirmations()
  }
  return {
    status,
    confirms
  }
}

exports.moneroBalance = async () => {
  return await monero.walletFull.getBalance()
}

exports.transfer = async (toAddress, amount) => {
  try {
    const beforeBalance = await monero.walletFull.getBalance()
    console.log({ beforeBalance })
    // let txs = await monero.walletFull.getTxs()
    const createdTx = await monero.walletFull.createTx({
      accountIndex: 0,
      address: toAddress,
      amount: new monerojs.BigInteger(String(amount)), // amount to transfer in atomic units
      relay: false // create transaction and relay to the network if true
    })
    await monero.walletFull.relayTx(createdTx) // relay the transaction

    return {
      txHash: createdTx.getHash(),
      beforeBalance
    }
  } catch (e) {
    console.log({ e })
    return null
  }
}
