import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    // 付款完成（單日券 + 月訂閱首次）
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      if (!userId || !plan) break

      if (plan === 'day_pass') {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan_type: 'day_pass',
          status: 'active',
          expires_at: expiresAt,
          stripe_customer_id: session.customer as string,
        }, { onConflict: 'user_id,plan_type' })
      }
      // monthly 訂閱由 customer.subscription.created 事件處理
      break
    }

    // 月訂閱啟動 / 更新
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      // user_id 從 metadata 或查現有記錄
      const uid = sub.metadata?.user_id || await (async () => {
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1)
          .single()
        return data?.user_id
      })()
      if (!uid) break

      const isActive = sub.status === 'active' || sub.status === 'trialing'
      // Stripe v22 移除 current_period_end，用 cancel_at 或下一個計費週期推算
      const endTs = sub.cancel_at
        ?? sub.billing_cycle_anchor + 32 * 24 * 60 * 60  // +32天 ≈ 下一個月
      const expiresAt = new Date(endTs * 1000).toISOString()

      await supabase.from('subscriptions').upsert({
        user_id: uid,
        plan_type: 'monthly',
        status: isActive ? 'active' : 'cancelled',
        expires_at: expiresAt,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
      }, { onConflict: 'user_id,plan_type' })
      break
    }

    // 訂閱取消（立即或到期後）
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', expires_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
