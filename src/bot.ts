import { createPinoLogger, createStore, WaClient } from 'zapo-js'
import { createSqliteStore } from '@zapo-js/store-sqlite'
import qrcode from 'qrcode-terminal'

import { registerCommands } from './commands/index.ts'

export async function createBot() {
  const logger = await createPinoLogger({ level: 'info', pretty: true })

  const store = createStore({
    backends: { sqlite: createSqliteStore({ path: '.auth/state.sqlite', driver: 'auto' }) },
    providers: {
      auth: 'sqlite', signal: 'sqlite', preKey: 'sqlite', session: 'sqlite',
      identity: 'sqlite', senderKey: 'sqlite', appState: 'sqlite',
      privacyToken: 'sqlite', messages: 'sqlite', threads: 'sqlite', contacts: 'sqlite'
    }
  })

  const client = new WaClient({ store, sessionId: 'default' }, logger)

  client.on('auth_qr', ({ qr, ttlMs }: { qr: string; ttlMs: number }) => {
    console.log(`Scan within ${ttlMs / 1000}s:`)
    qrcode.generate(qr, { small: true })
  })

  client.on('connection', (e: { status: string; reason?: string }) => {
    console.log('connection:', e.status, e.reason)
  })

  registerCommands(client)

  return client
}
