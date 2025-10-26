import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
