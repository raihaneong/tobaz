const USER_COOLDOWN_MS = 5 * 60_000
const GLOBAL_MAX_PER_HOUR = 10
const MAX_BYTES = 15 * 1024 * 1024
const MAX_VIDEO_SECONDS = 30

const lastByUser = new Map<string, number>()
let hourStart = Date.now()
let hourCount = 0

async function downloadMedia(media: any) {
  if (media?.buffer) return media.buffer
  if (media?.file) return media.file
  throw new Error('Media download not available for this message payload')
}

export function registerStoryCommand(client: any) {
  client.on('message', async (event: any) => {
    const m = event.message
    const groupJid = event.key.remoteJid
    if (!groupJid || !groupJid.endsWith('@g.us') || event.key.fromMe) return

    const text = m?.conversation ?? m?.extendedTextMessage?.text
    if (text?.trim().toLowerCase() !== '!story') return

    const sender = event.key.participant ?? groupJid
    const reply = (t: string) => client.message.send(groupJid, t)

    const now = Date.now()
    if (now - hourStart > 3_600_000) {
      hourStart = now
      hourCount = 0
    }
    if (hourCount >= GLOBAL_MAX_PER_HOUR) return reply('Story limit reached, try later.')
    if (now - (lastByUser.get(sender) ?? 0) < USER_COOLDOWN_MS) {
      return reply('Slow down, you can post once every 5 minutes.')
    }

    const quoted = m?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) return reply('Reply to a message with !story')

    const meta = await client.group.queryGroupMetadata(groupJid)
    const recipients = meta.participants.map((p: any) => p.jid)

    let content: any
    const qText = quoted.conversation ?? quoted.extendedTextMessage?.text
    if (qText) {
      content = qText
    } else if (quoted.imageMessage || quoted.videoMessage) {
      const isVideo = !!quoted.videoMessage
      const media = quoted.videoMessage ?? quoted.imageMessage
      if (Number(media.fileLength) > MAX_BYTES) return reply('File too large.')
      if (isVideo && media.seconds > MAX_VIDEO_SECONDS) return reply('Video too long.')

      const buf = await downloadMedia(media)
      content = {
        type: isVideo ? 'video' : 'image',
        media: buf,
        mimetype: media.mimetype,
        caption: media.caption,
      }
    } else {
      return reply('Only text, images and videos are supported.')
    }

    const result = await client.status.send({ content, recipients })
    lastByUser.set(sender, now)
    hourCount++
    console.log('story posted by', sender, result)
    await reply('Posted to story ✅')
  })
}