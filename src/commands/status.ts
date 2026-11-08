const getText = (m: any) => m?.conversation ?? m?.extendedTextMessage?.text

export function registerStatusCommand(client: any) {
  client.on('message', async (event: any) => {
    const text = getText(event.message)?.trim()
    const jid = event.key.remoteJid

    if (!text?.startsWith('!status ') || !jid?.endsWith('@g.us')) return
    if (!event.key.fromMe) return

    const meta = await client.group.queryGroupMetadata(jid)
    const recipients = meta.participants.map((participant: any) => participant.jid)

    await client.status.send({
      content: text.slice('!status '.length),
      recipients,
    })
  })
}
