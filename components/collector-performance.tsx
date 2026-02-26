"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface CollectorPerfProps {
  name: string
  initials: string
  zone: string
  collected: number
  target: number
  clients: number
}

export function CollectorPerformance({ collectors }: { collectors: CollectorPerfProps[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Performance des collecteurs</CardTitle>
        <CardDescription>Objectifs mensuels de collecte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {collectors.map((collector) => {
            const percentage = Math.round(
              (collector.collected / collector.target) * 100
            )
            return (
              <div key={collector.name} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {collector.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {collector.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {collector.zone} - {collector.clients} clients
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(collector.collected / 1000000).toFixed(1)}M FC</span>
                    <span>Obj: {(collector.target / 1000000).toFixed(1)}M FC</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
