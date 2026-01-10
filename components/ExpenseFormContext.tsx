'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ExpenseFormContextType {
  isOpen: boolean
  categoryId?: string
  openForm: (categoryId?: string) => void
  closeForm: () => void
}

const ExpenseFormContext = createContext<ExpenseFormContextType | null>(null)

export function ExpenseFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | undefined>()

  const openForm = (catId?: string) => {
    setCategoryId(catId)
    setIsOpen(true)
  }

  const closeForm = () => {
    setIsOpen(false)
    setCategoryId(undefined)
  }

  return (
    <ExpenseFormContext.Provider value={{ isOpen, categoryId, openForm, closeForm }}>
      {children}
    </ExpenseFormContext.Provider>
  )
}

export function useExpenseForm() {
  const context = useContext(ExpenseFormContext)
  if (!context) {
    throw new Error('useExpenseForm must be used within ExpenseFormProvider')
  }
  return context
}
