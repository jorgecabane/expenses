'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
]

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('ARS')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, currency }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear grupo')
        setLoading(false)
        return
      }

      // Redirigir a selección de bolsillos
      router.push(`/dashboard/setup/pockets?groupId=${data.group.id}`)
    } catch (err) {
      setError('Error al crear grupo')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear tu grupo</CardTitle>
        <CardDescription>
          Un grupo es donde compartirás finanzas con tu pareja, familia o amigos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del grupo</Label>
            <Input
              id="name"
              placeholder="Ej: Casa de Juan y María"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando grupo...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
