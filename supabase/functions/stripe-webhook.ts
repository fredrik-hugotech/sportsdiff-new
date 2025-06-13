import { serve } from 'https://deno.land/std/http/server.ts'
import { stripe } from '../_shared/stripe.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error(err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata.user_id

    await supabase.from('premium_users').upsert({ id: userId })
  }

  return new Response('ok', { status: 200 })
})
