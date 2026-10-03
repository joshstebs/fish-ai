import React from 'react';
import { claimCheckoutSession, claimRecoveryToken } from '../utils/billing';

export function BillingBootstrap() {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');
    const recovery = params.get('billing_recovery');

    async function settle() {
      try {
        if (checkout === 'success' && sessionId) {
          await claimCheckoutSession(sessionId);
        } else if (recovery) {
          await claimRecoveryToken(recovery);
        }
      } catch (error) {
        console.error('FishAI billing bootstrap failed:', error);
      } finally {
        if (checkout || sessionId || recovery) {
          history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
      }
    }

    void settle();
  }, []);

  return null;
}
