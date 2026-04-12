"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isValidRedirect(redirect: string): boolean {
  return redirect.startsWith("/") && !redirect.includes("//");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    const target =
      redirect && isValidRedirect(redirect) ? redirect : "/mobile/assistant";
    router.push(target);
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-xl font-semibold">登录</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number">工号</Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="请输入工号"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
        </div>
        <Button className="w-full" onClick={handleLogin}>
          登录
        </Button>
      </div>
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
