export interface User {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
}
