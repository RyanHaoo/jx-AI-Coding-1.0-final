"use client";

import { ArrowRight, Badge, Building2, Lock, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import { login, selectIdentity } from "@/app/login/actions";
import { IdentityDialog } from "@/components/identity-dialog";
import type { IdentityOption, LoginResult } from "@/lib/types";

function isValidRedirect(redirect: string): boolean {
  return redirect.startsWith("/") && !redirect.includes("//");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? "";
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: LoginResult | null, formData: FormData) => {
      return await login(formData);
    },
    null,
  );

  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [identities, setIdentities] = useState<IdentityOption[]>([]);

  useEffect(() => {
    if (state?.success && state.redirectUrl) {
      const target =
        redirectParam && isValidRedirect(redirectParam)
          ? redirectParam
          : state.redirectUrl;
      router.push(target);
    } else if (
      state?.success &&
      state.needsIdentitySelect &&
      state.identities
    ) {
      setIdentities(state.identities);
      setIdentityDialogOpen(true);
    }
  }, [state, redirectParam, router]);

  async function handleIdentitySelect(identity: IdentityOption) {
    const formData = new FormData();
    formData.set("projectId", String(identity.projectId));
    formData.set("projectName", identity.projectName);
    formData.set("role", identity.role);
    await selectIdentity(formData);
    const target =
      redirectParam && isValidRedirect(redirectParam)
        ? redirectParam
        : identity.role === "管理员"
          ? "/dashboard/overview"
          : "/mobile/assistant";
    router.push(target);
  }

  return (
    <div className="bg-background flex min-h-full flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <Building2 className="text-primary mb-3 size-12" />
          <h1 className="text-foreground text-2xl font-bold tracking-wide">
            建筑施工质检情报员
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest">
            CONSTRUCTION INTELLIGENCE
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-xl p-6 shadow-md">
          <h2 className="text-foreground mb-6 text-center text-xl font-semibold">
            登录
          </h2>

          <form ref={formRef} action={formAction}>
            {redirectParam && (
              <input type="hidden" name="redirect" value={redirectParam} />
            )}

            {/* Worker Number */}
            <div className="mb-4">
              <label
                htmlFor="number"
                className="text-muted-foreground mb-1 block text-sm"
              >
                工号
              </label>
              <div className="bg-input flex items-center rounded-lg px-3 py-2.5">
                <Badge className="text-muted-foreground mr-2 size-5" />
                <input
                  id="number"
                  name="number"
                  type="text"
                  className="bg-transparent text-foreground flex-1 outline-none placeholder:text-muted-foreground/50"
                  placeholder="请输入工号"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="text-muted-foreground mb-1 block text-sm"
              >
                密码
              </label>
              <div className="bg-input flex items-center rounded-lg px-3 py-2.5">
                <Lock className="text-muted-foreground mr-2 size-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="bg-transparent text-foreground flex-1 outline-none placeholder:text-muted-foreground/50"
                  placeholder="请输入密码"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Error Message */}
            {state?.success === false && state.error && (
              <p className="mb-4 text-center text-sm text-red-600">
                {state.error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "登录中..." : "登录"}
              <ArrowRight className="size-5" />
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-start gap-2 px-2">
          <ShieldCheck className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">企业级加密保护</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              当前连接已通过端到端加密保护。所有操作日志将被审计记录，请确保在受信任的设备上操作。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            © 2024 建筑施工质检情报系统 · V2.4.0 PROFESSIONAL
          </p>
        </div>
      </div>

      {/* Identity Selection Dialog */}
      <IdentityDialog
        open={identityDialogOpen}
        onOpenChange={setIdentityDialogOpen}
        identities={identities}
        mode="login"
        onSelect={handleIdentitySelect}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
