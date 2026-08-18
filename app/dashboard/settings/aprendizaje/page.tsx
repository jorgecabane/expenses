import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AprendizajeContent from '@/components/AprendizajeContent'

export const dynamic = 'force-dynamic'

export default async function AprendizajePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { activeGroupId: true } })
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: { include: { categories: true } } },
  })
  if (memberships.length === 0) redirect('/dashboard/setup')

  const activeGroup =
    memberships.find((m: { group: { id: string } }) => m.group.id === dbUser?.activeGroupId)?.group ?? memberships[0].group

  return (
    <AprendizajeContent
      groupId={activeGroup.id}
      categories={activeGroup.categories.map((c: { id: string; name: string; icon: string | null }) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
      }))}
    />
  )
}
