'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Payment, Plan, Subscription } from '@/lib/api/types';

export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: () => clientFetch<Plan[]>('/billing/plans'),
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => clientFetch<Subscription | null>('/billing/subscription'),
  });
}

export function useMyInvoices() {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => clientFetch<Payment[]>('/billing/invoices'),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (planId: string) =>
      clientFetch<{ checkoutUrl: string; paymentId: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      }),
  });
}

export function useSyncCheckout() {
  return useMutation({
    mutationFn: ({ paymentId, transactionId }: { paymentId: string; transactionId: string }) =>
      clientFetch<Payment>('/billing/checkout/sync', {
        method: 'POST',
        body: JSON.stringify({ paymentId, transactionId }),
      }),
  });
}
