import { z } from 'zod'

// Conversa persistida por criação ("Suas criações" — histórico estilo GPT).
export const ThreadMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  ts: z.string(),
  attachments: z.array(z.string()).optional(),
})
export type ThreadMessage = z.infer<typeof ThreadMessageSchema>

// Seleções do composer que originaram a thread (para semear a geração).
export const ThreadMetaSchema = z.object({
  platform: z.string(),
  format: z.string(),
  communication: z.string(),
  product: z.string().optional(),
  author: z.string().optional(), // voz/identidade: 'infosaas' | 'flg'
  attachments: z.array(z.string()).optional(),
})
export type ThreadMeta = z.infer<typeof ThreadMetaSchema>

export const ThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  slug: z.string().optional(), // criação vinculada (quando o content é salvo)
  meta: ThreadMetaSchema.optional(),
  messages: z.array(ThreadMessageSchema),
})
export type Thread = z.infer<typeof ThreadSchema>
