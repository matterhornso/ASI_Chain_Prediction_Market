// Query a market's data (read-only via explore-deploy)
// Usage: MARKET_ID=0 node scripts/get-market.js
import { exploreDeploy } from './lib/asi-chain.js'

const marketId = parseInt(process.env.MARKET_ID || '0')

const term = `
new ack in {
  for (PredictionMarket <- @"asi_prediction_market_v1") {
    PredictionMarket!("getMarket", ${marketId}, *ack) |
    for (@result <- ack) {
      @"get_market_result"!(result)
    }
  }
}
`

console.log(`Querying market ${marketId}...`)
const result = await exploreDeploy(term)
console.log('Result:', JSON.stringify(result, null, 2))
