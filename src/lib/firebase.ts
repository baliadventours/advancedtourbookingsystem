import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId
};

// Log specific missing vars to console to help the user identify what's missing in AIS
if (!envConfig.apiKey && firebaseConfig.apiKey === 'remixed-api-key') {
  console.warn("Firebase API Key is missing in environment variables. Falling back to placeholder.");
}

// Use environment variables if at least apiKey is present, otherwise fallback to config file
const finalConfig = envConfig.apiKey ? { ...firebaseConfig, ...envConfig } : firebaseConfig;

const app = initializeApp(finalConfig);

// Security check: If config has placeholder values and no env vars are set, warn the user
if (!envConfig.apiKey && finalConfig.apiKey === 'remixed-api-key') {
  const missingVars = Object.entries(envConfig)
    .filter(([key, value]) => !value && key !== 'measurementId' && key !== 'firestoreDatabaseId')
    .map(([key]) => `VITE_FIREBASE_${key.toUpperCase()}`);
  
  if (missingVars.length > 0) {
    console.error(`CRITICAL: Firebase is not configured in AI Studio. 
Please add the following environment variables in the Settings menu: 
${missingVars.join(', ')}

Note: You must set these in AI Studio even if they are set on Vercel, as the preview environment is separate.`);
  }
}

export const db = getFirestore(app, finalConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const isAdminUser = (email: string | null | undefined, profileRole?: string) => {
  if (!email) return false;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'baliadventours@gmail.com';
  return email === adminEmail || email.toLowerCase().endsWith('@daytours.com') || profileRole === 'admin';
};

// Test connection
async function testConnection() {
  try {
    // Attempting to get a dummy doc to test responsiveness
    await getDocFromServer(doc(db, '_connection_test', 'test'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType: operation,
    path: path,
    authInfo: {
      userId: user?.uid || 'unauthenticated',
      email: user?.email || '',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || true,
      providerInfo: user?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
      })) || []
    }
  };
  throw new Error(JSON.stringify(errorInfo));
}
