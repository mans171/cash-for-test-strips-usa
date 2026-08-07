"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "./supabase/client"

export type ClientUser = {
  id: string
  email: string
}

export function useUser(): { user: ClientUser | null; loading: boolean } {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      setUser(u && u.email ? { id: u.id, email: u.email } : null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(u && u.email ? { id: u.id, email: u.email } : null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export async function signOut(): Promise<void> {
  const supabase = createBrowserSupabaseClient()
  await supabase.auth.signOut()
}
