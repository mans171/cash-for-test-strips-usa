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

  it('anon key cannot write to submissions at all', async () => {
    // The submissions_insert_anon policy was dropped (final-review adjudication):
    // the anon key is public (shipped to the browser), so an anon insert-only
    // policy let anyone POST directly to Supabase's REST API and bypass
    // createSubmission's phone-ownership check entirely. RLS is still enabled
    // on the table with zero policies now, so anon inserts are denied outright
    // and only the service-role client (supabaseAdmin) can write. All writes
    // go through createSubmission (lib/submissions.ts), which now uses
    // supabaseAdmin internally.
    const insertedId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        id: insertedId,
        target_company_id: null,
        payload: { name: 'Schema Test Co', states: ['NY'] },
        submitted_phone: '5555550000',
      })
    expect(insertError).not.toBeNull()

    // nothing to clean up: the insert above was denied, so no row was created
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
