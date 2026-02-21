'use client';

/**
 * Amplify Configuration Provider
 * Configures AWS Amplify on the client side
 */

import { useEffect } from 'react';
import { configureAmplify } from '@/lib/amplifyConfig';

export function AmplifyConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
}
