export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-black/15 rounded-lg bg-paper-raised/40">
      <div className="w-12 h-12 rounded-full bg-teal/10 text-teal-deep flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-display text-base font-bold mb-1">{title}</p>
      {description && <p className="text-[13px] text-ink/55 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
