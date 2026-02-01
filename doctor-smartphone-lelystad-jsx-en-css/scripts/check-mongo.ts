import dotenv from 'dotenv'

import connectDB from '../lib/mongodb'

function redactMongoUri(uri: string): string {
  // Hide credentials but keep host/db for debugging.
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/)([^@]+)@/i, '$1***@')
}

async function main() {
  dotenv.config({ path: '.env.local' })

  const rawUri = process.env.MONGODB_URI
  if (rawUri) {
    // Avoid printing secrets.
    console.log('MONGODB_URI:', redactMongoUri(rawUri))
  } else {
    console.log('MONGODB_URI: <missing>')
  }

  try {
    const mongoose = await connectDB()
    console.log('MongoDB connect: OK')
    await mongoose.connection.close()
    console.log('MongoDB close: OK')
  } catch (err: any) {
    console.error('MongoDB connect: FAILED')
    console.error('name:', err?.name)
    console.error('message:', err?.message)
    if (err?.code) console.error('code:', err.code)
    if (err?.reason) console.error('reason:', err.reason)
    process.exitCode = 1
  }
}

main()
