"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  description?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
            {change && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                    changeType === "positive" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    changeType === "negative" && "bg-red-500/10 text-red-600 dark:text-red-400",
                    changeType === "neutral" && "bg-muted text-muted-foreground"
                  )}
                >
                  {change}
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
