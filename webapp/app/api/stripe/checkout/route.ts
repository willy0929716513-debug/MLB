import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { PLANS, type PlanKey } from '@/lib/plans'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json() as { plan: PlanKey }
  const planConfig = PLANS[plan]
  if (!planConfig) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = PRICE_IDS[plan]
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!

  try {
    if (plan === 'monthly') {
      // 月訂閱：Stripe Subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/success?plan=monthly&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        metadata: { user_id: user.id, plan: 'monthly' },
      })
      return NextResponse.json({ url: session.url })
    } else {
      // 單日券：一次性付款
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/success?plan=day_pass&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        metadata: { user_id: user.id, plan: 'day_pass' },
      })
      return NextResponse.json({ url: session.url })
    }
  } catch (e) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
