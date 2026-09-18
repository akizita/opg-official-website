import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { getActiveDepartmentsWithMembers } from '@/lib/content/team'
import { createClient } from '@/lib/supabase/server'

describe('team & departments queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries active departments and nests active team members correctly', async () => {
    const mockDepartments = [
      { id: 1, name: 'Leadership', slug: 'leadership', display_order: 1 },
      { id: 2, name: 'Engineering', slug: 'engineering', display_order: 2 },
    ]
    const mockMembers = [
      {
        id: 'm1',
        department_id: 1,
        full_name: 'Alice',
        position: 'Director',
        display_order: 1,
      },
      {
        id: 'm2',
        department_id: 2,
        full_name: 'Bob',
        position: 'Lead Engineer',
        display_order: 1,
      },
      {
        id: 'm3',
        department_id: 2,
        full_name: 'Charlie',
        position: 'Senior Engineer',
        display_order: 2,
      },
    ]

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'departments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: mockDepartments, error: null }),
              }),
            }),
          }
        }
        if (table === 'team_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: mockMembers, error: null }),
              }),
            }),
          }
        }
        return {}
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getActiveDepartmentsWithMembers()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Leadership')
    expect(result[0].members).toHaveLength(1)
    expect(result[0].members[0].full_name).toBe('Alice')

    expect(result[1].name).toBe('Engineering')
    expect(result[1].members).toHaveLength(2)
    expect(result[1].members[0].full_name).toBe('Bob')
    expect(result[1].members[1].full_name).toBe('Charlie')
  })
})
