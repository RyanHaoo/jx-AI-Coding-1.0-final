interface UserAvatarChipProps {
  name: string;
  department: string;
  projectName?: string;
  role?: string;
  compact?: boolean;
}

export function UserAvatarChip({
  name,
  department,
  projectName,
  role,
  compact = false,
}: UserAvatarChipProps) {
  const initial = name.charAt(0);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-sm font-medium">
          {initial}
        </div>
        <span className="text-foreground text-sm">{name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-base font-medium">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{department}</p>
        {projectName && role && (
          <p className="text-muted-foreground truncate text-xs">
            {projectName} · {role}
          </p>
        )}
      </div>
    </div>
  );
}
