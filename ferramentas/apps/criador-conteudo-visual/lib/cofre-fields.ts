// Metadados dos campos de credencial do cofre (client-safe — SEM importar pg/@infosaas/cofre).
// Usado tanto pela página (server) quanto pelos forms (client).

export type SecretField = {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'url' | 'password'
}

export const SECRET_FIELDS: SecretField[] = [
  { key: 'nextcloud_url', label: 'Nextcloud — URL (WebDAV)', placeholder: 'https://nuvem.cliente.com/remote.php/dav', type: 'url' },
  { key: 'nextcloud_user', label: 'Nextcloud — usuário', placeholder: 'usuario', type: 'text' },
  { key: 'nextcloud_password', label: 'Nextcloud — app password', placeholder: '••••••••', type: 'password' },
  { key: 'openai_api_key', label: 'OpenAI — API key (geração de imagem)', placeholder: 'sk-…', type: 'password' },
  { key: 'composio_api_key', label: 'Composio — API key (publicação)', placeholder: '…', type: 'password' },
]
