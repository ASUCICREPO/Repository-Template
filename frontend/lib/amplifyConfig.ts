/**
 * AWS Amplify configuration for CincyMuse chatbot
 * Configures Cognito authentication for admin dashboard
 */

import { Amplify } from 'aws-amplify';

// Get configuration from environment variables
const USER_POOL_ID = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '';
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

/**
 * Amplify configuration object
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: USER_POOL_ID,
      userPoolClientId: USER_POOL_CLIENT_ID,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

/**
 * Configure Amplify with Cognito settings
 * Should be called once at app initialization
 */
export function configureAmplify(): void {
  if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
    console.warn('Amplify configuration incomplete - User Pool credentials missing');
    return;
  }

  try {
    Amplify.configure(amplifyConfig, { ssr: true });
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}
