import { FileEditor } from '@/components/files/FileEditor'

export default function IdentidadeVisualPage() {
  return <FileEditor title="Identidade Visual" scopes={[{ scope: 'identidade', label: 'Identidade Visual' }]} />
}
