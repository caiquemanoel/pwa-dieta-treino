export interface User {
  id: string
  email: string
  nome?: string
  idade?: number
  peso?: number
  altura?: number
  nivel?: string
  objetivo?: string
  tempo_disponivel?: number
  dias_por_semana?: number
  area_foco?: string
  limitacoes?: string[]
  descricao_limitacoes?: string
  criado_em?: string
  atualizado_em?: string
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  weight: number
  rest: number
  completed: boolean
  rpe: number
  video_url?: string
  notes?: string
}

export interface Workout {
  name: string
  exercises: Exercise[]
  duration: number
  focus_area: string
}

export interface PlanoTreino {
  id: string
  user_id: string
  dia: number
  treino_json: Workout
  criado_em: string
}

export interface Meal {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  foods: {
    name: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
  completed: boolean
}

export interface DietPlan {
  meals: Meal[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export interface PlanoDieta {
  id: string
  user_id: string
  dia: number
  dieta_json: DietPlan
  criado_em: string
}

export interface Measurements {
  peito?: number
  braco?: number
  cintura?: number
  coxa?: number
  panturrilha?: number
}

export interface Progresso {
  id: string
  user_id: string
  peso?: number
  medidas_json?: Measurements
  data: string
  criado_em: string
}
