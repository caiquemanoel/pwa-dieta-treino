'use server'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { Workout, DietPlan } from '@/lib/supabase/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface OnboardingData {
  goal: string
  level: string
  daysPerWeek: string
  sessionTime: string
  equipment: string[]
  idade?: number
  peso?: number
  altura?: number
  area_foco?: string
  limitacoes?: string[]
  descricao_limitacoes?: string
}

export async function generateWorkoutPlan(userData: OnboardingData) {
  try {
    const prompt = `Você é um personal trainer experiente. Crie um plano de treino de 30 dias COMPLETO e DETALHADO para:

PERFIL DO USUÁRIO:
- Objetivo: ${userData.goal}
- Nível: ${userData.level}
- Frequência: ${userData.daysPerWeek}
- Tempo por sessão: ${userData.sessionTime}
- Equipamentos: ${userData.equipment.join(', ')}
${userData.idade ? `- Idade: ${userData.idade} anos` : ''}
${userData.peso ? `- Peso: ${userData.peso} kg` : ''}
${userData.altura ? `- Altura: ${userData.altura} cm` : ''}
${userData.area_foco ? `- Área de foco: ${userData.area_foco}` : ''}
${userData.limitacoes?.length ? `- Limitações: ${userData.limitacoes.join(', ')}` : ''}
${userData.descricao_limitacoes ? `- Detalhes das limitações: ${userData.descricao_limitacoes}` : ''}

INSTRUÇÕES:
1. Crie exatamente 30 dias de treino
2. Respeite a frequência semanal escolhida (dias de treino + dias de descanso)
3. Varie os treinos para evitar monotonia
4. Inclua progressão de carga ao longo dos 30 dias
5. Para cada exercício, forneça:
   - Nome do exercício em português
   - Número de séries
   - Número de repetições (pode ser range como "8-10")
   - Carga sugerida em kg (baseada no nível)
   - Tempo de descanso em segundos
   - URL de vídeo do YouTube (procure vídeos reais e populares)

FORMATO DE RESPOSTA (JSON):
Retorne um array com 30 objetos, cada um representando um dia:

[
  {
    "dia": 1,
    "treino": {
      "name": "Peito e Tríceps",
      "exercises": [
        {
          "name": "Supino Reto",
          "sets": 4,
          "reps": "8-10",
          "weight": 60,
          "rest": 120,
          "completed": false,
          "rpe": 0,
          "video_url": "https://youtube.com/watch?v=...",
          "notes": "Mantenha os cotovelos a 45 graus"
        }
      ],
      "duration": 60,
      "focus_area": "Peito e Tríceps"
    }
  }
]

IMPORTANTE:
- Dias de descanso devem ter treino null ou treino de recuperação ativa
- Progressão gradual de carga
- Exercícios adequados ao nível do usuário
- Respeite as limitações físicas mencionadas`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um personal trainer experiente especializado em criar planos de treino personalizados. Sempre responda em JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('Resposta vazia da IA')

    const workoutPlan = JSON.parse(response)
    return workoutPlan
  } catch (error) {
    console.error('Erro ao gerar plano de treino:', error)
    throw error
  }
}

export async function generateDietPlan(userData: OnboardingData) {
  try {
    const prompt = `Você é um nutricionista experiente. Crie um plano alimentar de 30 dias COMPLETO e DETALHADO para:

PERFIL DO USUÁRIO:
- Objetivo: ${userData.goal}
- Nível de atividade: ${userData.level}
${userData.idade ? `- Idade: ${userData.idade} anos` : ''}
${userData.peso ? `- Peso: ${userData.peso} kg` : ''}
${userData.altura ? `- Altura: ${userData.altura} cm` : ''}

INSTRUÇÕES:
1. Crie exatamente 30 dias de dieta
2. Use APENAS alimentos brasileiros comuns e acessíveis
3. Calcule calorias e macros baseados no objetivo:
   - Hipertrofia: superávit calórico, alta proteína
   - Emagrecimento: déficit calórico, alta proteína
   - Definição: déficit moderado, proteína moderada-alta
4. Para cada dia, forneça 6 refeições:
   - Café da Manhã
   - Lanche da Manhã
   - Almoço
   - Lanche da Tarde
   - Jantar
   - Ceia
5. Para cada refeição, liste os alimentos com:
   - Nome do alimento
   - Quantidade (em gramas ou unidades)
   - Calorias
   - Proteínas (g)
   - Carboidratos (g)
   - Gorduras (g)

FORMATO DE RESPOSTA (JSON):
Retorne um array com 30 objetos, cada um representando um dia:

[
  {
    "dia": 1,
    "dieta": {
      "meals": [
        {
          "name": "Café da Manhã",
          "calories": 450,
          "protein": 25,
          "carbs": 45,
          "fat": 18,
          "foods": [
            {
              "name": "Pão integral",
              "quantity": "2 fatias (50g)",
              "calories": 120,
              "protein": 5,
              "carbs": 22,
              "fat": 2
            },
            {
              "name": "Ovo mexido",
              "quantity": "2 ovos",
              "calories": 180,
              "protein": 14,
              "carbs": 2,
              "fat": 12
            }
          ],
          "completed": false
        }
      ],
      "total_calories": 2200,
      "total_protein": 165,
      "total_carbs": 220,
      "total_fat": 70
    }
  }
]

IMPORTANTE:
- Alimentos brasileiros e acessíveis
- Variedade ao longo dos 30 dias
- Macros balanceados para o objetivo
- Refeições práticas e realistas`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um nutricionista experiente especializado em dietas brasileiras. Sempre responda em JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('Resposta vazia da IA')

    const dietPlan = JSON.parse(response)
    return dietPlan
  } catch (error) {
    console.error('Erro ao gerar plano de dieta:', error)
    throw error
  }
}

export async function saveUserProfile(userId: string, data: OnboardingData) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('users').upsert({
      id: userId,
      nivel: data.level,
      objetivo: data.goal,
      tempo_disponivel: parseInt(data.sessionTime.split('-')[0]),
      dias_por_semana: parseInt(data.daysPerWeek.split(' ')[0]),
      idade: data.idade,
      peso: data.peso,
      altura: data.altura,
      area_foco: data.area_foco,
      limitacoes: data.limitacoes,
      descricao_limitacoes: data.descricao_limitacoes,
      atualizado_em: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error)
    throw error
  }
}

export async function saveWorkoutPlan(userId: string, workoutPlan: any) {
  try {
    const supabase = await createClient()

    // Preparar dados para inserção
    const workouts = workoutPlan.days || workoutPlan.plano || []
    const insertData = workouts.map((day: any) => ({
      user_id: userId,
      dia: day.dia,
      treino_json: day.treino,
    }))

    const { error } = await supabase.from('planos_treino').upsert(insertData, {
      onConflict: 'user_id,dia',
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar plano de treino:', error)
    throw error
  }
}

export async function saveDietPlan(userId: string, dietPlan: any) {
  try {
    const supabase = await createClient()

    // Preparar dados para inserção
    const diets = dietPlan.days || dietPlan.plano || []
    const insertData = diets.map((day: any) => ({
      user_id: userId,
      dia: day.dia,
      dieta_json: day.dieta,
    }))

    const { error } = await supabase.from('planos_dieta').upsert(insertData, {
      onConflict: 'user_id,dia',
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar plano de dieta:', error)
    throw error
  }
}
