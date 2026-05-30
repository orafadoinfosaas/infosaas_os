import { Composer } from '@/components/composer/Composer'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 pb-24">
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-[#0d0d0d]">
        O que quer criar hoje?
      </h1>
      <Composer />
    </div>
  )
}
