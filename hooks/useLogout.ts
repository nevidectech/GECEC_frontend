"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function useLogout() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const logout = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error("La deconnexion a echoue.", {
          description: error.message,
        })
        return
      }

      router.replace("/login")
      router.refresh()
    })
  }

  return {
    logout,
    isPending,
  }
}
