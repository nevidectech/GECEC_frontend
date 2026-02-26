"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArrowDownToLine, ArrowUpFromLine, UserPlus, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityProps {
  id: string
  type: "deposit" | "client" | "carnet" | "withdrawal"
  title: string
  subtitle: string
  time: string
  amount?: string
}

const iconMap = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  client: UserPlus,
  carnet: BookOpen,
}

const iconColorMap = {
  deposit: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  withdrawal: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  client: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  carnet: "text-primary bg-primary/10",
}

export function RecentActivity({ activities }: { activities: ActivityProps[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Activite recente</CardTitle>
        <CardDescription>Dernieres operations du jour</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type]
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    iconColorMap[activity.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </span>
                    <StatusBadge
                      status={activity.type === "withdrawal" ? "warning" : "success"}
                      label={activity.type === "withdrawal" ? "En attente" : "Complété"}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.subtitle}</span>
                    <span>{"/"}</span>
                    <span>{activity.time}</span>
                  </div>
                  {activity.amount && (
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        activity.amount.startsWith("+") || activity.type === "deposit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {(activity.type === "deposit" && !activity.amount.startsWith("+")) ? `+${activity.amount}` : activity.amount}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
