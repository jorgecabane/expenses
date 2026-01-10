import { 
  User, 
  FamilyGroup, 
  Category, 
  MonthlyBudget, 
  Expense, 
  ExpenseShare,
  Income,
  SavingsGoal,
  GroupMember,
  GroupInvitation
} from '@prisma/client'

export type UserWithRelations = User & {
  createdGroups: FamilyGroup[]
  groupMemberships: GroupMember[]
}

export type FamilyGroupWithRelations = FamilyGroup & {
  owner: User
  members: (GroupMember & { user: User })[]
  categories: Category[]
  budgets: MonthlyBudget[]
  expenses: Expense[]
}

export type CategoryWithRelations = Category & {
  group: FamilyGroup
  owner?: User
  budgets: MonthlyBudget[]
  expenses: Expense[]
}

export type ExpenseWithRelations = Expense & {
  group: FamilyGroup
  category: Category
  creator: User
  expenseShares: (ExpenseShare & { user: User })[]
}

export type MonthlyBudgetWithRelations = MonthlyBudget & {
  group: FamilyGroup
  category: Category
}

export type PocketStatus = 'healthy' | 'warning' | 'critical' | 'empty'

export interface PocketStatusInfo {
  status: PocketStatus
  percentage: number
  remaining: number
  color: string
}
