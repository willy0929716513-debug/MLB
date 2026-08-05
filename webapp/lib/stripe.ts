import Stripe from 'stripe'
import type { PlanKey } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const PRICE_IDS: Record<PlanKey, string> = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  day_pass: process.env.STRIPE_DAYPASS_PRICE_ID!,
}
