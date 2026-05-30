import { FileEditor } from '@/components/files/FileEditor'

export default function DnaPage() {
  return (
    <FileEditor
      title="DNA"
      scopes={[
        { scope: 'dna', label: 'DNA da empresa' },
        { scope: 'skills', label: 'Comunicação (Funil)' },
      ]}
    />
  )
}
