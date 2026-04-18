import { createClient } from "@supabase/supabase-js";

/**
 * Supabase「服务端密钥」客户端：绕过 RLS。
 * 仅可在 Server（Route Handler / Server Action）中使用；
 * `tickets` 等表的写入必须由 Next.js API 先做登录与业务角色校验后再调用，
 * RLS 仍阻止浏览器匿名/直连 anon key 写入。
 *
 * @throws 若未配置 SUPABASE_SERVICE_ROLE_KEY（本地与生产均需设置）
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side mutations",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
