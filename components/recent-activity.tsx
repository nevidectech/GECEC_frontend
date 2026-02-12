"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArrowDownToLine, ArrowUpFromLine, UserPlus, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const activities = [
  {
    id: 1,
    type: "depot" as const,
    description: "Depot sur carnet #C-2024-1847",
    client: "Marie Kabila",
    amount: "+250,000 FC",
    time: "il y a 5 min",
    status: "success" as const,
  },
  {
    id: 2,
    type: "retrait" as const,
    description: "Retrait valide carnet #C-2024-0923",
    client: "Pierre Mutombo",
    amount: "-180,000 FC",
    time: "il y a 12 min",
    status: "warning" as const,
  },
  {
    id: 3,
    type: "nouveau" as const,
    description: "Nouveau client enregistre",
    client: "Josephine Kayembe",
    amount: null,
    time: "il y a 25 min",
    status: "info" as const,
  },
  {
    id: 4,
    type: "carnet" as const,
    description: "Carnet #C-2024-1848 cree",
    client: "Albert Tshisekedi",
    amount: "50,000 FC",
    time: "il y a 1h",
    status: "success" as const,
  },
  {
    id: 5,
    type: "depot" as const,
    description: "Depot collecte terrain",
    client: "Zone Lubumbashi-Est",
    amount: "+1,850,000 FC",
    time: "il y a 2h",
    status: "success" as const,
  },
]

const iconMap = {
  depot: ArrowDownToLine,
  retrait: ArrowUpFromLine,
  nouveau: UserPlus,
  carnet: BookOpen,
}

const iconColorMap = {
  depot: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  retrait: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  nouveau: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  carnet: "text-primary bg-primary/10",
}

const statusLabelMap = {
  success: "Complete",
  warning: "En attente",
  info: "Nouveau",
  error: "Erreur",
  default: "-",
}

export function RecentActivity() {
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
                      {activity.description}
                    </span>
                    <StatusBadge
                      status={activity.status}
                      label={statusLabelMap[activity.status]}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.client}</span>
                    <span>{"/"}</span>
                    <span>{activity.time}</span>
                  </div>
                  {activity.amount && (
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        activity.amount.startsWith("+")
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {activity.amount}
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
