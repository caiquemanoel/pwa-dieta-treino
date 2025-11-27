'use client'

import { useState, useEffect } from 'react'
import { Play, Target, Calendar, TrendingUp, Book, Settings, User, Home, Dumbbell, Apple, BarChart3, ChevronRight, Plus, Timer, Droplets, Flame, Activity, Award, Clock, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useWorkout } from '@/hooks/useWorkout'
import { useDiet } from '@/hooks/useDiet'
import { useProgress } from '@/hooks/useProgress'
import { generateWorkoutPlan, generateDietPlan, saveUserProfile, saveWorkoutPlan, saveDietPlan } from './actions/ai-generation'
import { saveProgress, updateWorkoutProgress, updateMealProgress } from './actions/progress'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function FitApp() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: userLoading } = useUser()
  
  const [currentScreen, setCurrentScreen] = useState('dashboard')
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [waterIntake, setWaterIntake] = useState(0)

  const { workout, loading: workoutLoading } = useWorkout(user?.id, currentDay)
  const { diet, loading: dietLoading } = useDiet(user?.id, currentDay)
  const { progress, loading: progressLoading } = useProgress(user?.id)

  // Onboarding state
  const [onboardingData, setOnboardingData] = useState({
    goal: '',
    level: '',
    daysPerWeek: '',
    sessionTime: '',
    equipment: [] as string[],
    preferences: [] as string[],
    idade: 0,
    peso: 0,
    altura: 0,
    area_foco: '',
    limitacoes: [] as string[],
    descricao_limitacoes: ''
  })

  useEffect(() => {
    // Verificar se usuário completou onboarding
    if (!userLoading && user) {
      if (!user.nivel || !user.objetivo) {
        setIsFirstTime(true)
        setCurrentScreen('onboarding')
      }
    }
  }, [user, userLoading])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1)
      }, 1000)
    } else if (restTimer === 0) {
      setIsResting(false)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const completeOnboarding = async () => {
    if (!user?.id) return

    setGeneratingPlan(true)
    try {
      // Salvar perfil do usuário
      await saveUserProfile(user.id, onboardingData)

      // Gerar planos de treino e dieta com IA
      const [workoutPlan, dietPlan] = await Promise.all([
        generateWorkoutPlan(onboardingData),
        generateDietPlan(onboardingData)
      ])

      // Salvar planos no Supabase
      await Promise.all([
        saveWorkoutPlan(user.id, workoutPlan),
        saveDietPlan(user.id, dietPlan)
      ])

      setIsFirstTime(false)
      setCurrentScreen('dashboard')
      router.refresh()
    } catch (error) {
      console.error('Erro ao completar onboarding:', error)
      alert('Erro ao gerar seu plano personalizado. Tente novamente.')
    } finally {
      setGeneratingPlan(false)
    }
  }

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds)
    setIsResting(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const updateExercise = async (index: number, field: string, value: any) => {
    if (!user?.id) return
    
    try {
      await updateWorkoutProgress(user.id, currentDay, index, field, value)
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error)
    }
  }

  const toggleMealComplete = async (mealIndex: number, completed: boolean) => {
    if (!user?.id) return

    try {
      await updateMealProgress(user.id, currentDay, mealIndex, completed)
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
      </div>
    )
  }

  // Onboarding Component
  const OnboardingScreen = () => {
    const steps = [
      {
        title: 'Qual seu objetivo?',
        options: ['Hipertrofia', 'Emagrecimento', 'Força', 'Resistência'],
        field: 'goal'
      },
      {
        title: 'Qual seu nível?',
        options: ['Iniciante', 'Intermediário', 'Avançado'],
        field: 'level'
      },
      {
        title: 'Quantos dias por semana?',
        options: ['3 dias', '4 dias', '5 dias', '6 dias'],
        field: 'daysPerWeek'
      },
      {
        title: 'Tempo por sessão?',
        options: ['30-45 min', '45-60 min', '60-90 min', '90+ min'],
        field: 'sessionTime'
      },
      {
        title: 'Equipamentos disponíveis?',
        options: ['Academia completa', 'Home gym', 'Peso corporal', 'Elásticos'],
        field: 'equipment',
        multiple: true
      }
    ]

    const currentStep = steps[onboardingStep]

    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2] p-6 flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">FitPro</h1>
            <p className="text-[#9AA8B2] text-center">Seu personal trainer digital</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 mx-1 rounded-full transition-colors duration-300 ${
                    index <= onboardingStep ? 'bg-[#F97316]' : 'bg-[#11161E]'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-[#9AA8B2] text-center">
              Etapa {onboardingStep + 1} de {steps.length}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">{currentStep.title}</h2>
            <div className="space-y-3">
              {currentStep.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (currentStep.multiple) {
                      const current = onboardingData[currentStep.field as keyof typeof onboardingData] as string[]
                      const updated = current.includes(option)
                        ? current.filter(item => item !== option)
                        : [...current, option]
                      setOnboardingData(prev => ({ ...prev, [currentStep.field]: updated }))
                    } else {
                      setOnboardingData(prev => ({ ...prev, [currentStep.field]: option }))
                    }
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${
                    currentStep.multiple
                      ? (onboardingData[currentStep.field as keyof typeof onboardingData] as string[])?.includes(option)
                        ? 'border-[#F97316] bg-[#F97316]/10'
                        : 'border-[#11161E] bg-[#11161E]/50 hover:border-[#F97316]/50'
                      : onboardingData[currentStep.field as keyof typeof onboardingData] === option
                      ? 'border-[#F97316] bg-[#F97316]/10'
                      : 'border-[#11161E] bg-[#11161E]/50 hover:border-[#F97316]/50'
                  }`}
                >
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {onboardingStep > 0 && (
            <button
              onClick={() => setOnboardingStep(prev => prev - 1)}
              disabled={generatingPlan}
              className="flex-1 py-4 px-6 rounded-2xl border border-[#11161E] text-[#9AA8B2] font-medium transition-colors duration-200 hover:border-[#F97316]/50 disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => {
              if (onboardingStep < steps.length - 1) {
                setOnboardingStep(prev => prev + 1)
              } else {
                completeOnboarding()
              }
            }}
            disabled={
              !onboardingData[currentStep.field as keyof typeof onboardingData] || 
              (currentStep.multiple && (onboardingData[currentStep.field as keyof typeof onboardingData] as string[]).length === 0) ||
              generatingPlan
            }
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F97316]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generatingPlan ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando seu plano...
              </>
            ) : (
              <>{onboardingStep < steps.length - 1 ? 'Continuar' : 'Finalizar'}</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Dashboard Component
  const DashboardScreen = () => {
    const todayWorkout = workout?.treino_json
    const todayDiet = diet?.dieta_json

    // Calcular calorias consumidas
    const caloriesConsumed = todayDiet?.meals
      ?.filter(m => m.completed)
      .reduce((sum, m) => sum + m.calories, 0) || 0
    const caloriesTarget = todayDiet?.total_calories || 2200

    // Calcular macros consumidos
    const proteinConsumed = todayDiet?.meals
      ?.filter(m => m.completed)
      .reduce((sum, m) => sum + m.protein, 0) || 0
    const carbsConsumed = todayDiet?.meals
      ?.filter(m => m.completed)
      .reduce((sum, m) => sum + m.carbs, 0) || 0
    const fatConsumed = todayDiet?.meals
      ?.filter(m => m.completed)
      .reduce((sum, m) => sum + m.fat, 0) || 0

    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2]">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Olá, {user?.nome || 'Atleta'}! 👋</h1>
              <p className="text-[#9AA8B2]">Vamos treinar hoje?</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#11161E] px-3 py-2 rounded-xl">
                <Flame className="w-4 h-4 text-[#F97316]" />
                <span className="text-sm font-medium">{progress.length}</span>
              </div>
              <button
                onClick={() => setCurrentScreen('profile')}
                className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#11161E] p-4 rounded-2xl border border-[#1A1F2E]">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-[#F97316]" />
                <span className="text-xs text-[#9AA8B2]">Calorias</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{caloriesConsumed}</span>
                <span className="text-sm text-[#9AA8B2]">/{caloriesTarget}</span>
              </div>
              <div className="w-full bg-[#0B0F14] rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-[#F97316] to-[#EA580C] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((caloriesConsumed / caloriesTarget) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#11161E] p-4 rounded-2xl border border-[#1A1F2E]">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-[#9AA8B2]">Água</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{waterIntake}</span>
                <span className="text-sm text-[#9AA8B2]">/8</span>
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < waterIntake ? 'bg-blue-400' : 'bg-[#0B0F14]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Today's Workout */}
          {todayWorkout && (
            <div className="bg-gradient-to-br from-[#F97316]/10 to-[#EA580C]/5 p-6 rounded-2xl border border-[#F97316]/20 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#F97316]">Treino de Hoje</h3>
                  <p className="text-[#9AA8B2]">{todayWorkout.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#9AA8B2]">{todayWorkout.exercises.length} exercícios</p>
                  <p className="text-sm text-[#9AA8B2]">{todayWorkout.duration} min</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentScreen('workout')}
                className="w-full bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-[#F97316]/25"
              >
                <Play className="w-5 h-5" />
                Iniciar Treino
              </button>
            </div>
          )}

          {/* Macros */}
          {todayDiet && (
            <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mb-6">
              <h3 className="text-lg font-bold mb-4">Macronutrientes</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#9AA8B2]">Proteína</span>
                    <span className="text-sm">{proteinConsumed}g / {todayDiet.total_protein}g</span>
                  </div>
                  <div className="w-full bg-[#0B0F14] rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((proteinConsumed / todayDiet.total_protein) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#9AA8B2]">Carboidratos</span>
                    <span className="text-sm">{carbsConsumed}g / {todayDiet.total_carbs}g</span>
                  </div>
                  <div className="w-full bg-[#0B0F14] rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((carbsConsumed / todayDiet.total_carbs) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#9AA8B2]">Gordura</span>
                    <span className="text-sm">{fatConsumed}g / {todayDiet.total_fat}g</span>
                  </div>
                  <div className="w-full bg-[#0B0F14] rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((fatConsumed / todayDiet.total_fat) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentScreen('diet')}
              className="bg-[#11161E] p-4 rounded-2xl border border-[#1A1F2E] flex flex-col items-center gap-2 transition-all duration-200 hover:border-[#F97316]/50"
            >
              <Apple className="w-6 h-6 text-[#F97316]" />
              <span className="text-sm font-medium">Dieta</span>
            </button>
            <button
              onClick={() => setCurrentScreen('progress')}
              className="bg-[#11161E] p-4 rounded-2xl border border-[#1A1F2E] flex flex-col items-center gap-2 transition-all duration-200 hover:border-[#F97316]/50"
            >
              <TrendingUp className="w-6 h-6 text-[#F97316]" />
              <span className="text-sm font-medium">Progresso</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Workout Screen
  const WorkoutScreen = () => {
    const todayWorkout = workout?.treino_json

    if (!todayWorkout) {
      return (
        <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2] flex items-center justify-center">
          <div className="text-center">
            <Dumbbell className="w-16 h-16 text-[#9AA8B2] mx-auto mb-4" />
            <p className="text-[#9AA8B2]">Nenhum treino para hoje</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2]">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold">{todayWorkout.name}</h1>
              <p className="text-[#9AA8B2] text-sm">{todayWorkout.exercises.length} exercícios • {todayWorkout.duration} min</p>
            </div>
            <button className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Rest Timer */}
          {isResting && (
            <div className="bg-gradient-to-br from-[#F97316]/10 to-[#EA580C]/5 p-6 rounded-2xl border border-[#F97316]/20 mb-6">
              <div className="text-center">
                <Timer className="w-8 h-8 text-[#F97316] mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-[#F97316]">{formatTime(restTimer)}</h3>
                <p className="text-[#9AA8B2]">Tempo de descanso</p>
                <button
                  onClick={() => setIsResting(false)}
                  className="mt-4 px-6 py-2 bg-[#F97316] text-white rounded-xl text-sm font-medium"
                >
                  Pular Descanso
                </button>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-4">
            {todayWorkout.exercises.map((exercise, index) => (
              <div key={index} className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{exercise.name}</h3>
                    <p className="text-[#9AA8B2] text-sm">{exercise.sets} séries • {exercise.reps} reps</p>
                  </div>
                  <button
                    onClick={() => updateExercise(index, 'completed', !exercise.completed)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      exercise.completed 
                        ? 'border-[#F97316] bg-[#F97316] text-white' 
                        : 'border-[#9AA8B2] hover:border-[#F97316]'
                    }`}
                  >
                    {exercise.completed && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-[#9AA8B2] block mb-1">Carga (kg)</label>
                    <input
                      type="number"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(index, 'weight', parseInt(e.target.value))}
                      className="w-full bg-[#0B0F14] border border-[#1A1F2E] rounded-xl px-3 py-2 text-center font-medium focus:border-[#F97316] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9AA8B2] block mb-1">RPE</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={exercise.rpe || ''}
                      onChange={(e) => updateExercise(index, 'rpe', parseInt(e.target.value))}
                      className="w-full bg-[#0B0F14] border border-[#1A1F2E] rounded-xl px-3 py-2 text-center font-medium focus:border-[#F97316] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9AA8B2] block mb-1">Descanso</label>
                    <button
                      onClick={() => startRestTimer(exercise.rest)}
                      className="w-full bg-[#F97316] text-white rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-[#EA580C]"
                    >
                      {exercise.rest}s
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {exercise.video_url && (
                    <a
                      href={exercise.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#0B0F14] border border-[#1A1F2E] text-[#9AA8B2] py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:border-[#F97316]/50 text-center"
                    >
                      Ver Vídeo
                    </a>
                  )}
                  <button className="flex-1 bg-[#0B0F14] border border-[#1A1F2E] text-[#9AA8B2] py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:border-[#F97316]/50">
                    Histórico
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pb-6">
            <button 
              onClick={() => setCurrentScreen('dashboard')}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white py-4 rounded-2xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F97316]/25"
            >
              Finalizar Treino
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Diet Screen
  const DietScreen = () => {
    const todayDiet = diet?.dieta_json

    if (!todayDiet) {
      return (
        <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2] flex items-center justify-center">
          <div className="text-center">
            <Apple className="w-16 h-16 text-[#9AA8B2] mx-auto mb-4" />
            <p className="text-[#9AA8B2]">Nenhuma dieta para hoje</p>
          </div>
        </div>
      )
    }

    const caloriesConsumed = todayDiet.meals
      .filter(m => m.completed)
      .reduce((sum, m) => sum + m.calories, 0)
    const proteinConsumed = todayDiet.meals
      .filter(m => m.completed)
      .reduce((sum, m) => sum + m.protein, 0)
    const carbsConsumed = todayDiet.meals
      .filter(m => m.completed)
      .reduce((sum, m) => sum + m.carbs, 0)
    const fatConsumed = todayDiet.meals
      .filter(m => m.completed)
      .reduce((sum, m) => sum + m.fat, 0)

    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h1 className="text-xl font-bold">Dieta do Dia</h1>
            <button className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Daily Summary */}
          <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#F97316]">{caloriesConsumed}</p>
                <p className="text-xs text-[#9AA8B2]">Calorias</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{proteinConsumed}g</p>
                <p className="text-xs text-[#9AA8B2]">Proteína</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{carbsConsumed}g</p>
                <p className="text-xs text-[#9AA8B2]">Carbos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{fatConsumed}g</p>
                <p className="text-xs text-[#9AA8B2]">Gordura</p>
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-4">
            {todayDiet.meals.map((meal, index) => (
              <div key={index} className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMealComplete(index, !meal.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        meal.completed 
                          ? 'border-[#F97316] bg-[#F97316] text-white' 
                          : 'border-[#9AA8B2] hover:border-[#F97316]'
                      }`}
                    >
                      {meal.completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className="font-bold">{meal.name}</h3>
                      <p className="text-[#9AA8B2] text-sm">{meal.calories} kcal</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9AA8B2]" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium text-green-500">{meal.protein}g</p>
                    <p className="text-xs text-[#9AA8B2]">Proteína</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-500">{meal.carbs}g</p>
                    <p className="text-xs text-[#9AA8B2]">Carbos</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-500">{meal.fat}g</p>
                    <p className="text-xs text-[#9AA8B2]">Gordura</p>
                  </div>
                </div>

                {meal.foods && meal.foods.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1A1F2E]">
                    <p className="text-xs text-[#9AA8B2] mb-2">Alimentos:</p>
                    <div className="space-y-1">
                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="flex justify-between text-sm">
                          <span className="text-[#9AA8B2]">{food.name}</span>
                          <span className="text-[#E6EBF2]">{food.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Water Tracking */}
          <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold">Hidratação</h3>
              </div>
              <span className="text-sm text-[#9AA8B2]">{waterIntake}/8 copos</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setWaterIntake(i + 1)}
                  className={`flex-1 h-12 rounded-xl transition-all duration-200 ${
                    i < waterIntake 
                      ? 'bg-blue-400 text-white' 
                      : 'bg-[#0B0F14] border border-[#1A1F2E] hover:border-blue-400/50'
                  }`}
                >
                  <Droplets className="w-5 h-5 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Progress Screen
  const ProgressScreen = () => {
    const latestProgress = progress[0]
    const weightData = progress.slice(0, 4).reverse().map(p => p.peso || 0)

    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h1 className="text-xl font-bold">Progresso</h1>
            <button className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Weight Progress */}
          <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Peso Corporal</h3>
              <span className="text-[#F97316] font-bold">{latestProgress?.peso || user?.peso || 0} kg</span>
            </div>
            {weightData.length > 0 && (
              <div className="h-32 bg-[#0B0F14] rounded-xl p-4 flex items-end justify-between">
                {weightData.map((weight, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-[#F97316] to-[#EA580C] rounded-t"
                      style={{ height: `${(weight / Math.max(...weightData, 1)) * 100}%` }}
                    />
                    <span className="text-xs text-[#9AA8B2] mt-2">{weight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body Measurements */}
          {latestProgress?.medidas_json && (
            <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mb-6">
              <h3 className="font-bold mb-4">Medidas Corporais</h3>
              <div className="space-y-3">
                {Object.entries(latestProgress.medidas_json).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[#9AA8B2] capitalize">{key}</span>
                    <span className="font-medium">{value} cm</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Timeline */}
          <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Linha do Tempo</h3>
              <button className="text-[#F97316] text-sm font-medium">Ver Todas</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="aspect-square bg-[#0B0F14] rounded-xl border border-[#1A1F2E] flex items-center justify-center">
                  <User className="w-8 h-8 text-[#9AA8B2]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EBF2]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-xl font-bold">Perfil</h1>
          <button className="w-10 h-10 bg-[#11161E] rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-[#11161E] p-6 rounded-2xl border border-[#1A1F2E] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.nome || 'Atleta'}</h2>
              <p className="text-[#9AA8B2]">{user?.objetivo} • {user?.nivel}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#F97316]">{progress.length}</p>
              <p className="text-xs text-[#9AA8B2]">Registros</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.peso || 0}</p>
              <p className="text-xs text-[#9AA8B2]">Peso atual</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.dias_por_semana || 0}</p>
              <p className="text-xs text-[#9AA8B2]">Dias/semana</p>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          {[
            { icon: Target, label: 'Meus Objetivos', screen: 'goals' },
            { icon: Calendar, label: 'Plano de Treino', screen: 'plan' },
            { icon: Book, label: 'Biblioteca', screen: 'library' },
            { icon: Activity, label: 'Estatísticas', screen: 'stats' },
            { icon: Settings, label: 'Configurações', screen: 'settings' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentScreen(item.screen)}
              className="w-full bg-[#11161E] p-4 rounded-2xl border border-[#1A1F2E] flex items-center justify-between transition-all duration-200 hover:border-[#F97316]/50"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-[#F97316]" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9AA8B2]" />
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => {
              setIsFirstTime(true)
              setCurrentScreen('onboarding')
              setOnboardingStep(0)
            }}
            className="w-full bg-[#11161E] border border-[#1A1F2E] text-[#9AA8B2] py-4 rounded-2xl font-medium transition-all duration-200 hover:border-[#F97316]/50"
          >
            Refazer Configuração Inicial
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl font-medium transition-all duration-200 hover:bg-red-500/20"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  )

  // Bottom Navigation
  const BottomNav = () => {
    if (currentScreen === 'onboarding') return null

    const navItems = [
      { icon: Home, label: 'Início', screen: 'dashboard' },
      { icon: Dumbbell, label: 'Treino', screen: 'workout' },
      { icon: Apple, label: 'Dieta', screen: 'diet' },
      { icon: BarChart3, label: 'Progresso', screen: 'progress' },
      { icon: User, label: 'Perfil', screen: 'profile' }
    ]

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#11161E] border-t border-[#1A1F2E] px-6 py-4">
        <div className="flex justify-between">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentScreen(item.screen)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                currentScreen === item.screen 
                  ? 'text-[#F97316]' 
                  : 'text-[#9AA8B2] hover:text-[#F97316]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen />
      case 'dashboard':
        return <DashboardScreen />
      case 'workout':
        return <WorkoutScreen />
      case 'diet':
        return <DietScreen />
      case 'progress':
        return <ProgressScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <DashboardScreen />
    }
  }

  return (
    <div className="font-inter">
      {renderScreen()}
      <BottomNav />
      {currentScreen !== 'onboarding' && <div className="h-20" />}
    </div>
  )
}
