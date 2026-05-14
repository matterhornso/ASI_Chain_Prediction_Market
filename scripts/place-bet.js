// Place a bet on a market
// Usage: PRIVATE_KEY=xxx MARKET_ID=0 BETTOR=alice SIDE=yes AMOUNT=1000 node scripts/place-bet.js
import { deploy, waitForConfirmation } from './lib/asi-chain.js'

const marketId = parseInt(process.env.MARKET_ID || '0')
const bettor = process.env.BETTOR || 'bettor1'
const side = process.env.SIDE || 'yes'
const amount = parseInt(process.env.AMOUNT || '1000')

const term = `
new ack in {
  for (PredictionMarket <- @"asi_prediction_market_v1") {
    PredictionMarket!("placeBet", ${marketId}, "${bettor}", "${side}", ${amount}, *ack) |
    for (@result <- ack) {
      @"place_bet_result"!(result)
    }
  }
}
`

console.log(`Placing bet: market=${marketId}, bettor=${bettor}, side=${side}, amount=${amount}`)
const deployId = await deploy(term, 500_000)
console.log('Deploy ID:', deployId)
console.log('Waiting for confirmation...')
await waitForConfirmation(deployId)
console.log('Bet placed!')
