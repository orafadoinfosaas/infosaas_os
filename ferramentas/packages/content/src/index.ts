export * from './schemas/index.js' // schema + tipos (FunnelPhase, TemplateId, Content, TemplateConfig, …)
export * from './templates/index.js' // TEMPLATES, getTemplate, editorial, bold, narrativa
export * from './commands.js' // CommandSchema, Command, makeCommand, applyCommands, summarizeCommands
export * from './dna-prompt.js' // montagem do system prompt do DNA
export * from './store.js' // convenção de slug + caminho do conteúdo (editor ↔ chat)
export type { ContentType, SystemPromptOptions, DNAFiles } from './types.js'
