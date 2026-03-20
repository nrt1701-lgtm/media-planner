import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateClientSchema } from '@/lib/validators/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', clientId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()

  // Check for active campaigns
  const { count, error: countError } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .is('deleted_at', null)

  if (countError) return Response.json({ error: countError.message }, { status: 500 })

  if (count && count > 0) {
    return Response.json({ error: 'Cannot delete client with active campaigns.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
