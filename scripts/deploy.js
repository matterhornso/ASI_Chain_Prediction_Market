// Deploy the prediction market contract to ASI:Chain DevNet
import { deploy, waitForConfirmation, readContract } from './lib/asi-chain.js'

const term = readContract('contracts/prediction-market.rho')

console.log('Deploying prediction market to ASI:Chain DevNet...')
const deployId = await deploy(term, 1_000_000)
console.log('Deploy ID:', deployId)
console.log('Explorer:', `https://explorer.dev.asichain.io/transaction/${deployId}`)

console.log('Waiting for confirmation (~10-30s)...')
const result = await waitForConfirmation(deployId)
console.log('Confirmed in block:', result.block_number)
console.log('Prediction market deployed successfully!')
