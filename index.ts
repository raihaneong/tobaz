import { createBot } from './src/bot.ts'

const client = await createBot()

await client.connect()