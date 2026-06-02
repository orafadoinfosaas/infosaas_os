// Upload de arquivos para o Cloudflare R2 (bucket público). Usado para hospedar
// o MP4 do Reel numa URL pública e limpa (sem query string) — requisito do
// Instagram, que busca o vídeo a partir dessa URL.
import { readFile } from 'fs/promises'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const MIME: Record<string, string> = { mp4: 'video/mp4', mov: 'video/quicktime' }

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  )
}

function client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

// Sobe um arquivo local para o R2 e devolve a URL pública (sem query string).
export async function uploadToR2(localPath: string, key: string): Promise<string> {
  if (!isR2Configured()) throw new Error('R2 não configurado (defina R2_* no .env.local)')
  const bucket = process.env.R2_BUCKET as string
  const base = (process.env.R2_PUBLIC_BASE_URL as string).replace(/\/$/, '')
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  const body = await readFile(localPath)

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: MIME[ext] ?? 'application/octet-stream',
    })
  )

  return `${base}/${key}`
}
