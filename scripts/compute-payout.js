// Compute a bettor's payout (read-only via explore-deploy)
// Usage: MARKET_ID=0 BETTOR=alice SIDE=yes node scripts/compute-payout.js
import { exploreDeploy } from './lib/asi-chain.js'

const marketId = parseInt(process.env.MARKET_ID || '0')
const bettor = process.env.BETTOR || 'bettor1'
const side = process.env.SIDE || 'yes'

const term = `
new ack in {
  for (PredictionMarket <- @"asi_prediction_market_v1") {
    PredictionMarket!("computePayout", ${marketId}, "${bettor}", "${side}", *ack) |
    for (@result <- ack) {
      @"compute_payout_result"!(result)
    }
  }
}
`

console.log(`Computing payout: market=${marketId}, bettor=${bettor}, side=${side}`)
const result = await exploreDeploy(term)
console.log('Result:', JSON.stringify(result, null, 2))
