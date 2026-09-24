import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="auth-page">
        <p>还没有配置注册。请在 .env.local 写入 Clerk 密钥后再打开。</p>
      </div>
    );
  }
  return (
    <div className="auth-page">
      <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
    </div>
  );
}
