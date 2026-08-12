import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { isValidZip } from "@/lib/geo"
import { getZipCentroid } from "@/lib/zip-lookup"

export async function GET(request: Request) {
  const zip = new URL(request.url).searchParams.get("zip") ?? ""
  if (!isValidZip(zip)) return NextResponse.json({ state: null }, { status: 400 })
  const centroid = await getZipCentroid(supabase, zip)
  return NextResponse.json({ state: centroid?.state ?? null })
}
