'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanoDieta } from '@/lib/supabase/types'

export function useDiet(userId: string | undefined, dia: number) {
  const [diet, setDiet] = useState<PlanoDieta | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadDiet() {
      try {
        const { data, error } = await supabase
          .from('planos_dieta')
          .select('*')
          .eq('user_id', userId)
          .eq('dia', dia)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setDiet(data)
      } catch (error) {
        console.error('Erro ao carregar dieta:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDiet()
  }, [userId, dia])

  return { diet, loading, setDiet }
}
