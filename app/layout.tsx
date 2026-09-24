import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { LocaleProvider } from '@/components/LocaleProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spark',
  description: 'Interactive stories shaped by your choices.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const preferredRegion = 'sin1';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {clerkKey ? (
          <ClerkProvider
            publishableKey={clerkKey}
            afterSignOutUrl="/"
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              variables: {
                colorPrimary: '#d7b56d',
                colorPrimaryForeground: '#1b140c',
                colorBackground: '#1c1c22',
                colorForeground: '#f4efe6',
                colorMutedForeground: '#c8c0b4',
                colorInput: '#111114',
                colorInputForeground: '#f4efe6',
                colorNeutral: '#9a9388',
                borderRadius: '12px',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                fontFamilyButtons: 'ui-sans-serif, system-ui, sans-serif',
              },
            }}
          >
            <LocaleProvider>{children}</LocaleProvider>
          </ClerkProvider>
        ) : (
          <LocaleProvider>{children}</LocaleProvider>
        )}
      </body>
    </html>
  );
}
