import type { ReactNode } from "react";

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="px-4">
      <p className="text-xs font-semibold text-muted-foreground   tracking-wider mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}
