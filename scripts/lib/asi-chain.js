// Shared ASI:Chain DevNet deploy + query utilities
import { secp256k1 as secp } from '@noble/curves/secp256k1'
import { blake2b } from '@noble/hashes/blake2b'
import { bytesToHex, hexToBytes, utf8ToBytes, concatBytes } from '@noble/hashes/utils'
import { readFileSync } from 'fs'

export const VALIDATOR_URL = 'https://ihmps4dkpg.execute-api.us-east-1.amazonaws.com/prod/bb93eaa595aaddf6912e372debc73eef/endpoint_0/HTTP_API'
export const INDEXER = 'https://indexer.dev.asichain.io/v1/graphql'

// --- Protobuf helpers for signing projection ---
function encodeVarint(value) {
  const bytes = []
  let v = BigInt(value)
  while (v > 127n) { bytes.push(Number((v & 0xffn) | 0x80n)); v >>= 7n }
  bytes.push(Number(v))
  return new Uint8Array(bytes)
}
function tag(n, w) { return encodeVarint((n << 3) | w) }
function str(n, v) {
  if (!v) return new Uint8Array(0)
  const e = utf8ToBytes(v)
  return concatBytes(tag(n, 2), encodeVarint(e.length), e)
}
function int64(n, v) {
  if (!v) return new Uint8Array(0)
  return concatBytes(tag(n, 0), encodeVarint(v))
}

function getPrivateKey() {
  const key = process.env.PRIVATE_KEY
  if (!key) throw new Error('PRIVATE_KEY env var not set. Copy .env.example to .env and add your key.')
  return key.replace(/^0x/, '')
}

export async function deploy(term, phloLimit = 1_000_000) {
  const privateKeyHex = getPrivateKey()
  const privateKey = hexToBytes(privateKeyHex)
  const timestamp = Date.now()

  const blocksRes = await fetch(`${VALIDATOR_URL}/api/blocks/1`)
  const blocks = await blocksRes.json()
  const validAfterBlockNumber = blocks[0]?.blockNumber ?? 0

  // Build signing projection — language field is EXCLUDED
  const projection = concatBytes(
    str(2, term), int64(3, timestamp), int64(7, 1),
    int64(8, phloLimit), int64(10, validAfterBlockNumber), str(11, 'root')
  )
  const hash = blake2b(projection, { dkLen: 32 })
  const sig = secp.sign(hash, privateKey, { lowS: true })
  const pubKey = secp.getPublicKey(privateKey, false) // 65 bytes with 04 prefix

  const body = {
    data: { term, timestamp, phloPrice: 1, phloLimit, validAfterBlockNumber, shardId: 'root', language: 'rholang' },
    deployer: bytesToHex(pubKey),
    signature: sig.toDERHex(),
    sigAlgorithm: 'secp256k1',
  }

  const res = await fetch(`${VALIDATOR_URL}/api/deploy`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Deploy failed (${res.status}): ${text}`)

  const match = text.match(/[0-9a-f]{100,}/i)
  const deployId = match ? match[0] : text.replace(/"/g, '')
  return deployId
}

export async function exploreDeploy(term) {
  const res = await fetch(`${VALIDATOR_URL}/api/explore-deploy`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term }),
  })
  return res.json()
}

export async function waitForConfirmation(deployId, timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 10_000))
    const res = await fetch(INDEXER, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{ deployments(where: {deploy_id: {_eq: "${deployId}"}}) { deploy_id errored error_message block_number } }` }),
    })
    const json = await res.json()
    const d = json.data?.deployments?.[0]
    if (d) {
      if (d.errored) throw new Error(`Deploy errored: ${d.error_message}`)
      return d
    }
  }
  throw new Error('Confirmation timeout — check explorer: https://explorer.dev.asichain.io/transaction/' + deployId)
}

export function readContract(path) {
  return readFileSync(path, 'utf8')
}
