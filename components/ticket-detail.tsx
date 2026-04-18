"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectChip } from "@/components/project-chip";
import { TicketActions } from "@/components/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatarChip } from "@/components/user-avatar-chip";
import type { TicketWithRelations } from "@/lib/tickets";
import type { Role, Severity, SpecialtyType, TicketStatus } from "@/lib/types";

interface TicketDetailProps {
  ticket: TicketWithRelations;
  userIdentity: {
    userId: string;
    role: Role;
  } | null;
}

const statusVariantMap: Record<
  TicketStatus,
  "default" | "secondary" | "destructive"
> = {
  待处理: "secondary",
  已完成: "default",
  已拒绝: "destructive",
};

const SEVERITY_OPTIONS: Severity[] = ["轻微", "一般", "严重", "紧急"];
const SPECIALTY_OPTIONS: SpecialtyType[] = [
  "建筑设计专业",
  "结构专业",
  "给排水专业",
];

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="text-muted-foreground w-20 shrink-0 text-sm">
        {label}
      </span>
      <div className="text-foreground min-w-0 flex-1 text-sm">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-foreground border-b pb-2 text-sm font-medium">
      {children}
    </h3>
  );
}

export function TicketDetail({ ticket, userIdentity }: TicketDetailProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Edit form state
  const [severity, setSeverity] = useState<Severity>(ticket.severity);
  const [specialtyType, setSpecialtyType] = useState<SpecialtyType>(
    ticket.specialty_type,
  );
  const [description, setDescription] = useState(ticket.description);
  const [location, setLocation] = useState(ticket.location);
  const [detail, setDetail] = useState(ticket.detail);

  const isCreator = userIdentity?.userId === ticket.creator_id;
  const isAssignee = userIdentity?.userId === ticket.assignee_id;
  const isAdmin = userIdentity?.role === "管理员";
  const canEdit = isCreator || isAssignee || isAdmin;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severity,
          specialty_type: specialtyType,
          description,
          location,
          detail,
        }),
      });
      if (res.ok) {
        setMode("view");
        router.refresh();
      } else {
        alert("保存失败，请稍后重试");
      }
    } catch {
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* 基础信息 — always readonly */}
      <section>
        <SectionTitle>基础信息</SectionTitle>
        <FieldRow label="工单 ID">{ticket.id}</FieldRow>
        <FieldRow label="状态">
          <Badge variant={statusVariantMap[ticket.status]}>
            {ticket.status}
          </Badge>
        </FieldRow>
        <FieldRow label="创建时间">
          {new Date(ticket.created_at).toLocaleString("zh-CN")}
        </FieldRow>
        <FieldRow label="发起人">
          <UserAvatarChip
            name={ticket.creator.name}
            department={ticket.creator.department}
            compact
          />
        </FieldRow>
        <FieldRow label="所在项目">
          <ProjectChip
            name={ticket.project.name}
            clientName={ticket.project.client_name}
          />
        </FieldRow>
        <FieldRow label="责任人">
          <UserAvatarChip
            name={ticket.assignee.name}
            department={ticket.assignee.department}
            compact
          />
        </FieldRow>
        {canEdit && mode === "view" && (
          <div className="pt-2">
            <button
              type="button"
              className="text-primary text-sm underline"
              onClick={() => setMode("edit")}
            >
              编辑
            </button>
          </div>
        )}
        {mode === "edit" && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className="text-muted-foreground text-sm underline"
              onClick={() => setMode("view")}
              disabled={saving}
            >
              取消
            </button>
          </div>
        )}
      </section>

      {/* 工单详情 — editable in edit mode */}
      <section>
        <SectionTitle>工单详情</SectionTitle>
        {mode === "edit" ? (
          <>
            <FieldRow label="严重程度">
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as Severity)}
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
            </FieldRow>
            <FieldRow label="专业类型">
              <Select
                value={specialtyType}
                onValueChange={(v) => setSpecialtyType(v as SpecialtyType)}
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
            </FieldRow>
            <FieldRow label="问题描述">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="详细位置">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="图片">
              <span className="text-muted-foreground text-sm">
                图片上传（后续实现）
              </span>
            </FieldRow>
            <FieldRow label="问题详情">
              <textarea
                className="border-input bg-transparent w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </FieldRow>
          </>
        ) : (
          <>
            <FieldRow label="严重程度">{ticket.severity}</FieldRow>
            <FieldRow label="专业类型">{ticket.specialty_type}</FieldRow>
            <FieldRow label="问题描述">{ticket.description}</FieldRow>
            <FieldRow label="详细位置">{ticket.location}</FieldRow>
            {ticket.images.length > 0 && (
              <FieldRow label="图片">
                <div className="flex flex-wrap gap-2">
                  {ticket.images.map((url, i) => (
                    <Image
                      key={url}
                      src={url}
                      alt={`图片 ${i + 1}`}
                      width={80}
                      height={80}
                      className="size-20 rounded object-cover"
                    />
                  ))}
                </div>
              </FieldRow>
            )}
            {ticket.detail && (
              <FieldRow label="问题详情">{ticket.detail}</FieldRow>
            )}
          </>
        )}
      </section>

      {/* 工单复盘 — always readonly */}
      <section>
        <SectionTitle>工单复盘</SectionTitle>
        {ticket.root_cause ? (
          <FieldRow label="问题归因">{ticket.root_cause}</FieldRow>
        ) : (
          <FieldRow label="问题归因">
            <span className="text-muted-foreground">暂无</span>
          </FieldRow>
        )}
        {ticket.prevention ? (
          <FieldRow label="预防建议">{ticket.prevention}</FieldRow>
        ) : (
          <FieldRow label="预防建议">
            <span className="text-muted-foreground">暂无</span>
          </FieldRow>
        )}
        <FieldRow label="知识库">
          {ticket.knowledge_base ? "已转化" : "未转化"}
        </FieldRow>
      </section>

      {/* 操作按钮 — view mode only */}
      {mode === "view" && userIdentity && (
        <TicketActions ticket={ticket} userIdentity={userIdentity} />
      )}
    </div>
  );
}
