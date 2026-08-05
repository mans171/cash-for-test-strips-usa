import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('buyer portal schema', () => {
  it('companies has email and mail_in columns', async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('email, mail_in')
      .limit(1)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('has exactly one active mail_in company with the CFTS Mail-In slug', async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, slug, phone, active')
      .eq('mail_in', true)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].slug).toBe('cfts-mail-in')
    expect(data![0].active).toBe(true)
  })

  it('anon key can insert into submissions but cannot read it back', async () => {
    // NOTE: Postgres RLS governs INSERT...RETURNING through SELECT policies, not
    // the INSERT policy. Since anon has no SELECT policy on submissions (by design —
    // customers can write but not read others' data), any `.insert().select()` call
    // fails outright, even though the bare insert succeeds. So this test — and every
    // later insert into submissions/leads from the anon client — generates its own id
    // client-side and inserts it explicitly, instead of relying on RETURNING.
    const insertedId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        id: insertedId,
        target_company_id: null,
        payload: { name: 'Schema Test Co', states: ['NY'] },
        submitted_phone: '5555550000',
      })
    expect(insertError).toBeNull()

    const { data: readBack } = await supabase
      .from('submissions')
      .select('id')
      .eq('id', insertedId)
    expect(readBack).toEqual([])

    // cleanup via admin client, since anon has no delete policy
    await supabaseAdmin.from('submissions').delete().eq('id', insertedId)
  })

  it('rejects an anon insert that tries to pre-set status to approved', async () => {
    const spoofedId = crypto.randomUUID()
    const { error } = await supabase.from('submissions').insert({
      id: spoofedId,
      target_company_id: null,
      payload: { name: 'Spoof Test Co', states: ['NY'] },
      submitted_phone: '5555550099',
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()

    // cleanup in case the insert somehow succeeded
    await supabaseAdmin.from('submissions').delete().eq('id', spoofedId)
  })
})
