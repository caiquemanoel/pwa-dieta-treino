'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanoTreino } from '@/lib/supabase/types'

export function useWorkout(userId: string | undefined, dia: number) {
  const [workout, setWorkout] = useState<PlanoTreino | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadWorkout() {
      try {
        const { data, error } = await supabase
          .from('planos_treino')
          .select('*')
          .eq('user_id', userId)
          .eq('dia', dia)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setWorkout(data)
      } catch (error) {
        console.error('Erro ao carregar treino:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkout()
  }, [userId, dia])

  return { workout, loading, setWorkout }
}
