import { registerStatusCommand } from './status.ts'
import { registerStoryCommand } from './story.ts'

export type CommandRegistrar = (client: any) => void

export function registerCommands(client: any) {
  const commands: CommandRegistrar[] = [
    registerStatusCommand,
    registerStoryCommand,
  ]

  for (const register of commands) {
    register(client)
  }
}
