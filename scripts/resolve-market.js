// Resolve a market (must be called by the oracle)
// Usage: PRIVATE_KEY=xxx MARKET_ID=0 CALLER=oracle1 OUTCOME=yes node scripts/resolve-market.js
import { deploy, waitForConfirmation } from './lib/asi-chain.js'

const marketId = parseInt(process.env.MARKET_ID || '0')
const caller = process.env.CALLER || 'oracle1'
const outcome = process.env.OUTCOME || 'yes'

const term = `
new ack in {
  for (PredictionMarket <- @"asi_prediction_market_v1") {
    PredictionMarket!("resolveMarket", ${marketId}, "${caller}", "${outcome}", *ack) |
    for (@result <- ack) {
      @"resolve_market_result"!(result)
    }
  }
}
`

console.log(`Resolving market ${marketId} with outcome="${outcome}" (caller: ${caller})`)
const deployId = await deploy(term, 500_000)
console.log('Deploy ID:', deployId)
console.log('Waiting for confirmation...')
await waitForConfirmation(deployId)
console.log('Market resolved!')
