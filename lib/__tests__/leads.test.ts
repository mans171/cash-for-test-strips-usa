import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLead } from '@/lib/leads'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

describe('createLead', () => {
  it('inserts a lead with items, channel, and matched company', async () => {
    const lead = await createLead({
      items: [{ brand: 'OneTouch Verio', count: 2, expiration: '2027-01', condition: 'sealed' }],
      matchedCompanyId: null,
      channel: 'sms',
      sourcePage: '/sell',
      name: 'Test Customer',
    })
    cleanupIds.push(lead.id)

    expect(lead.channel).toBe('sms')
    expect(lead.items).toHaveLength(1)
    expect(lead.source_page).toBe('/sell')
  })

  it('stores name, email, and phone when provided', async () => {
    const lead = await createLead({
      items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
      matchedCompanyId: null,
      channel: 'email',
      sourcePage: '/sell',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '5551234567',
    })
    cleanupIds.push(lead.id)

    expect(lead.name).toBe('Jane Doe')
    expect(lead.email).toBe('jane@example.com')
    expect(lead.phone).toBe('5551234567')
  })
})
