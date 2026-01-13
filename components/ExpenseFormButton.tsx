'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ExpenseForm from './ExpenseForm'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  isPersonal: boolean
  ownerId: string | null
}

interface ExpenseFormButtonProps {
  groupId: string
  categories: Category[]
}

export default function ExpenseFormButton({ groupId, categories }: ExpenseFormButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Agregar gasto
      </Button>
      <ExpenseForm
        open={open}
        onOpenChange={setOpen}
        groupId={groupId}
        categories={categories}
      />
    </>
  )
}
