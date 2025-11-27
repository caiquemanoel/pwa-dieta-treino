'use server'

import { createClient } from '@/lib/supabase/server'
import type { Measurements } from '@/lib/supabase/types'

export async function saveProgress(userId: string, peso?: number, medidas?: Measurements) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('progresso').insert({
      user_id: userId,
      peso,
      medidas_json: medidas,
      data: new Date().toISOString().split('T')[0],
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar progresso:', error)
    throw error
  }
}

export async function updateWorkoutProgress(
  userId: string,
  dia: number,
  exerciseIndex: number,
  field: string,
  value: any
) {
  try {
    const supabase = await createClient()

    // Buscar treino atual
    const { data: workout, error: fetchError } = await supabase
      .from('planos_treino')
      .select('*')
      .eq('user_id', userId)
      .eq('dia', dia)
      .single()

    if (fetchError) throw fetchError

    // Atualizar exercício
    const updatedWorkout = { ...workout }
    updatedWorkout.treino_json.exercises[exerciseIndex] = {
      ...updatedWorkout.treino_json.exercises[exerciseIndex],
      [field]: value,
    }

    // Salvar de volta
    const { error: updateError } = await supabase
      .from('planos_treino')
      .update({ treino_json: updatedWorkout.treino_json })
      .eq('user_id', userId)
      .eq('dia', dia)

    if (updateError) throw updateError
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar progresso do treino:', error)
    throw error
  }
}

export async function updateMealProgress(
  userId: string,
  dia: number,
  mealIndex: number,
  completed: boolean
) {
  try {
    const supabase = await createClient()

    // Buscar dieta atual
    const { data: diet, error: fetchError } = await supabase
      .from('planos_dieta')
      .select('*')
      .eq('user_id', userId)
      .eq('dia', dia)
      .single()

    if (fetchError) throw fetchError

    // Atualizar refeição
    const updatedDiet = { ...diet }
    updatedDiet.dieta_json.meals[mealIndex].completed = completed

    // Salvar de volta
    const { error: updateError } = await supabase
      .from('planos_dieta')
      .update({ dieta_json: updatedDiet.dieta_json })
      .eq('user_id', userId)
      .eq('dia', dia)

    if (updateError) throw updateError
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar progresso da dieta:', error)
    throw error
  }
}

export async function updateWaterIntake(userId: string, glasses: number) {
  try {
    const supabase = await createClient()

    // Salvar no localStorage do usuário ou criar tabela específica
    // Por enquanto, vamos usar metadata do usuário
    const { error } = await supabase
      .from('users')
      .update({ 
        // Adicionar campo water_intake se necessário
      })
      .eq('id', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar água:', error)
    throw error
  }
}
