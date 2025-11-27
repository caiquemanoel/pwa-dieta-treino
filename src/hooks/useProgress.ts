'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Progresso } from '@/lib/supabase/types'

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Progresso[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadProgress() {
      try {
        const { data, error } = await supabase
          .from('progresso')
          .select('*')
          .eq('user_id', userId)
          .order('data', { ascending: false })
          .limit(30)

        if (error) throw error
        setProgress(data || [])
      } catch (error) {
        console.error('Erro ao carregar progresso:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [userId])

  return { progress, loading, setProgress }
}
