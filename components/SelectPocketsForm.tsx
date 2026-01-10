'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Pocket {
  name: string
  icon: string
  description: string
}

interface SelectPocketsFormProps {
  groupId: string
  predefinedPockets: Pocket[]
}

export default function SelectPocketsForm({ groupId, predefinedPockets }: SelectPocketsFormProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const togglePocket = (name: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelected(newSelected)
  }

  const selectAll = () => {
    setSelected(new Set(predefinedPockets.map((p) => p.name)))
  }

  const handleContinue = async () => {
    if (selected.size === 0) {
      return
    }

    setLoading(true)

    try {
      // Crear las categorías seleccionadas
      const selectedPockets = predefinedPockets.filter((p) => selected.has(p.name))

      await Promise.all(
        selectedPockets.map((pocket) =>
          fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId,
              name: pocket.name,
              icon: pocket.icon,
              isPersonal: false, // Por defecto compartidos
            }),
          })
        )
      )

      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating pockets:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={selectAll} disabled={loading}>
          Agregar todos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {predefinedPockets.map((pocket) => {
          const isSelected = selected.has(pocket.name)
          return (
            <Card
              key={pocket.name}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => togglePocket(pocket.name)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{pocket.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{pocket.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pocket.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="rounded-full bg-primary text-primary-foreground p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          disabled={loading}
        >
          Empezar vacío
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selected.size === 0 || loading}
        >
          {loading ? 'Creando...' : `Continuar con ${selected.size} bolsillos`}
        </Button>
      </div>
    </div>
  )
}
