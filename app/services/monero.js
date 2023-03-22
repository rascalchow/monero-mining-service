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

exports.transfer = async (toAddress, amount) => {
  try {
    const beforeBalance = await monero.walletRpc.getBalance()
    console.log({ beforeBalance })
    // let txs = await monero.walletRpc.getTxs()
    const createdTx = await monero.walletRpc.createTx({
      accountIndex: 0,
      address: toAddress,
      amount: new monerojs.BigInteger(String(amount)), // amount to transfer in atomic units
      relay: false // create transaction and relay to the network if true
    })
    const fee = createdTx.getFee() // "Are you sure you want to send... ?"
    const afterBalance = await monero.walletRpc.getBalance()
    console.log({ afterBalance })
    await monero.walletRpc.relayTx(createdTx) // relay the transaction

    return {
      txHash: createdTx.getHash(),
      beforeBalance,
      afterBalance
    }
  } catch (e) {
    console.log({ e })
    return null
  }
}
