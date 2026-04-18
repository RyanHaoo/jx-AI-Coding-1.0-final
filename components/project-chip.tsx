interface ProjectChipProps {
  name: string;
  clientName: string;
}

export function ProjectChip({ name, clientName }: ProjectChipProps) {
  return (
    <span className="text-foreground text-sm">
      {name}（{clientName}）
    </span>
  );
}
