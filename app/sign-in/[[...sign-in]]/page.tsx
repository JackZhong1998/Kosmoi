import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="auth-page">
        <p>还没有配置登录。请在 .env.local 写入 Clerk 密钥后再打开。</p>
      </div>
    );
  }
  return (
    <div className="auth-page">
      <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
    </div>
  );
}
