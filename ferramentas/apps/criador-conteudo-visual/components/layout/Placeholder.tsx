import { Construction } from 'lucide-react'

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-black/[0.04] text-[#9d9d9d] mb-4">
        <Construction size={24} />
      </div>
      <h1 className="text-xl font-semibold text-[#0d0d0d]">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-[#8e8e8e]">{description}</p>
    </div>
  )
}
