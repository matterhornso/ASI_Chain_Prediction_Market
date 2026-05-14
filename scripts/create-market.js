// Create a new prediction market
// Usage: PRIVATE_KEY=xxx QUESTION="Will BTC hit 100k?" ORACLE=alice node scripts/create-market.js
import { deploy, waitForConfirmation } from './lib/asi-chain.js'

const question = process.env.QUESTION || 'Will BTC hit 100k by end of 2026?'
const oracle = process.env.ORACLE || 'oracle1'

const term = `
new ack, marketCh in {
  for (PredictionMarket <- @"asi_prediction_market_v1") {
    PredictionMarket!("createMarket", "${question}", "${oracle}", *ack) |
    for (@result <- ack) {
      @"create_market_result"!(result)
    }
  }
}
`

console.log(`Creating market: "${question}" (oracle: ${oracle})`)
const deployId = await deploy(term, 500_000)
console.log('Deploy ID:', deployId)
console.log('Waiting for confirmation...')
const result = await waitForConfirmation(deployId)
console.log('Market created! Check explorer:', `https://explorer.dev.asichain.io/transaction/${deployId}`)
