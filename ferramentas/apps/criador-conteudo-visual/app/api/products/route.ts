import { NextResponse } from 'next/server'
import { listProducts } from '@/lib/dna/products'

export async function GET() {
  return NextResponse.json(await listProducts())
}
