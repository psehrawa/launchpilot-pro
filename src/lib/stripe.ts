import Stripe from "stripe";

// Only initialize Stripe if API key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : null;

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      contacts: 100,
      emails: 200,
      enrichments: 50,
      seats: 1,
    },
  },
  starter: {
    name: "Starter",
    price: 19,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    limits: {
      contacts: 1000,
      emails: 3000,
      enrichments: 500,
      seats: 1,
    },
  },
  growth: {
    name: "Growth",
    price: 49,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    limits: {
      contacts: 10000,
      emails: 15000,
      enrichments: 2000,
      seats: 3,
    },
  },
  scale: {
    name: "Scale",
    price: 99,
    priceId: process.env.STRIPE_SCALE_PRICE_ID,
    limits: {
      contacts: -1, // unlimited
      emails: 50000,
      enrichments: 5000,
      seats: 10,
    },
  },
};

export type PlanKey = keyof typeof PLANS;
