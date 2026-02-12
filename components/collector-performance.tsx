"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

const collectors = [
  {
    name: "Patrick Mbuyi",
    initials: "PM",
    zone: "Lubumbashi-Centre",
    collected: 4250000,
    target: 5000000,
    clients: 87,
  },
  {
    name: "Sarah Kalala",
    initials: "SK",
    zone: "Lubumbashi-Est",
    collected: 3800000,
    target: 4000000,
    clients: 72,
  },
  {
    name: "David Kasongo",
    initials: "DK",
    zone: "Likasi",
    collected: 2900000,
    target: 4000000,
    clients: 58,
  },
  {
    name: "Grace Mwamba",
    initials: "GM",
    zone: "Kolwezi",
    collected: 2100000,
    target: 3500000,
    clients: 45,
  },
  {
    name: "Felix Ilunga",
    initials: "FI",
    zone: "Kipushi",
    collected: 1650000,
    target: 2500000,
    clients: 34,
  },
]

export function CollectorPerformance() {
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
