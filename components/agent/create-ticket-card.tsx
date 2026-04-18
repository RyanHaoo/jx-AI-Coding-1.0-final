"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Severity, SpecialtyType } from "@/lib/types";

export interface CreateTicketSubmitResult {
  status: "success" | "error";
  ticket_id?: number;
  message?: string;
}

interface CreateTicketCardProps {
  toolCallId?: string;
  args?: {
    description?: string;
    location?: string;
    severity?: string;
    specialtyType?: string;
  };
  resolved?: CreateTicketSubmitResult | null;
  onSubmitted?: (result: CreateTicketSubmitResult) => void;
}

const SEVERITY_OPTIONS: Severity[] = ["轻微", "一般", "严重", "紧急"];
const SPECIALTY_OPTIONS: SpecialtyType[] = [
  "建筑设计专业",
  "结构专业",
  "给排水专业",
];

type AssigneeOption = { id: string; name: string; department: string };

function coerceSeverity(v?: string): Severity {
  return (SEVERITY_OPTIONS as string[]).includes(v ?? "")
    ? (v as Severity)
    : "一般";
}

function coerceSpecialty(v?: string): SpecialtyType {
  return (SPECIALTY_OPTIONS as string[]).includes(v ?? "")
    ? (v as SpecialtyType)
    : "建筑设计专业";
}

export function CreateTicketCard({
  toolCallId,
  args,
  resolved,
  onSubmitted,
}: CreateTicketCardProps) {
  const [description, setDescription] = useState(args?.description ?? "");
  const [location, setLocation] = useState(args?.location ?? "");
  const [severity, setSeverity] = useState<Severity>(
    coerceSeverity(args?.severity),
  );
  const [specialtyType, setSpecialtyType] = useState<SpecialtyType>(
    coerceSpecialty(args?.specialtyType),
  );
  const [detail, setDetail] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDone = Boolean(resolved);
  const readOnly = isDone || submitting;

  useEffect(() => {
    if (isDone) return;
    let cancelled = false;
    setLoadingAssignees(true);
    fetch("/api/assignees", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return (await res.json()) as { assignees: AssigneeOption[] };
      })
      .then((data) => {
        if (cancelled) return;
        setAssignees(data.assignees ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setAssignees([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignees(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDone]);

  const selectedAssignee = useMemo(
    () => assignees.find((a) => a.id === assigneeId),
    [assignees, assigneeId],
  );

  async function handleSubmit() {
    setErrorMsg(null);
    if (!description.trim() || !location.trim()) {
      setErrorMsg("问题描述和位置为必填项");
      return;
    }
    if (!assigneeId) {
      setErrorMsg("请选择责任人");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description: description.trim(),
          location: location.trim(),
          severity,
          specialty_type: specialtyType,
          assignee_id: assigneeId,
          detail: detail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const message = data.error ?? `创建失败 (${res.status})`;
        setErrorMsg(message);
        onSubmitted?.({ status: "error", message });
        return;
      }

      const data = (await res.json()) as { ticket?: { id: number } };
      const ticketId = data.ticket?.id;
      if (!ticketId) {
        const message = "服务返回异常，缺少工单编号";
        setErrorMsg(message);
        onSubmitted?.({ status: "error", message });
        return;
      }
      onSubmitted?.({ status: "success", ticket_id: ticketId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "网络异常";
      setErrorMsg(message);
      onSubmitted?.({ status: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card my-2 rounded-lg border p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <Badge>建单草稿</Badge>
        {isDone ? (
          resolved?.status === "success" ? (
            <span className="text-muted-foreground text-xs">
              已创建，编号 #{resolved.ticket_id}
            </span>
          ) : (
            <span className="text-destructive text-xs">
              提交失败：{resolved?.message ?? "未知错误"}
            </span>
          )
        ) : (
          <span className="text-muted-foreground text-xs">
            请确认以下信息后提交
          </span>
        )}
        {toolCallId ? (
          <span className="text-muted-foreground ml-auto hidden text-[10px] sm:inline">
            {toolCallId.slice(0, 8)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3">
        <Field label="问题描述" required>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={readOnly}
            placeholder="例如：3 号楼 5 层卫生间瓷砖空鼓"
          />
        </Field>

        <Field label="位置" required>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={readOnly}
            placeholder="例如：东区 3 号楼 5 层卫生间"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="严重程度">
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as Severity)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="专业类型">
            <Select
              value={specialtyType}
              onValueChange={(v) => setSpecialtyType(v as SpecialtyType)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="责任人" required>
          {isDone ? (
            <span className="text-muted-foreground">
              {selectedAssignee
                ? `${selectedAssignee.name}（${selectedAssignee.department}）`
                : "—"}
            </span>
          ) : (
            <Select
              value={assigneeId}
              onValueChange={setAssigneeId}
              disabled={readOnly || loadingAssignees}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingAssignees ? "加载中..." : "选择施工方责任人"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {assignees.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-xs">
                    当前项目暂无可选施工方
                  </div>
                ) : (
                  assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}（{a.department}）
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label="问题详情">
          <Textarea
            rows={2}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            disabled={readOnly}
            placeholder="可选，补充现场细节"
          />
        </Field>
      </div>

      {errorMsg && !isDone ? (
        <p className="text-destructive mt-2 text-xs">{errorMsg}</p>
      ) : null}

      {!isDone ? (
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner className="size-3" />
                提交中...
              </>
            ) : (
              "提交工单"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-muted-foreground text-xs">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
