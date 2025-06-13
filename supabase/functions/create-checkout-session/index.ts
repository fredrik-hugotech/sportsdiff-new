import { serve } from 'https://deno.land/std/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15'
})

serve(async (req) => {
  try {
    const { user_id, price_id } = await req.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${Deno.env.get('SITE_URL')}?success=true`,
      cancel_url: `${Deno.env.get('SITE_URL')}?cancel=true`,
      metadata: { user_id }
    })

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
