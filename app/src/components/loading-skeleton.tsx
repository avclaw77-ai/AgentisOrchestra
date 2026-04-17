"use client"

import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted rounded animate-pulse",
        className
      )}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl px-4 py-4">
            <Bone className="h-3 w-20 mb-3" />
            <Bone className="h-7 w-12" />
          </div>
        ))}
      </div>
      {/* Agent team */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-4 py-3 border-b border-border">
          <Bone className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1 p-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <Bone className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <Bone className="h-3.5 w-16 mb-1.5" />
                <Bone className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Activity + Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border">
            <Bone className="h-4 w-28" />
          </div>
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-border flex items-center gap-3">
                <Bone className="w-2 h-2 rounded-full" />
                <div className="flex-1">
                  <Bone className="h-3.5 w-48 mb-1.5" />
                  <Bone className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border">
            <Bone className="h-4 w-28" />
          </div>
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-border">
                <Bone className="h-3.5 w-32 mb-2" />
                <Bone className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <Bone className="h-5 w-24" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex gap-3 mb-4">
        <Bone className="h-9 w-52 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, col) => (
          <div key={col} className="bg-secondary/30 rounded-xl border border-border min-h-[300px]">
            <div className="px-4 py-3 border-b border-border">
              <Bone className="h-4 w-20" />
            </div>
            <div className="p-2 space-y-2">
              {[...Array(col === 1 ? 3 : col === 0 ? 4 : 2)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card px-3 py-2">
                  <Bone className="h-3.5 w-full mb-2" />
                  <div className="flex gap-2">
                    <Bone className="h-2.5 w-14" />
                    <Bone className="h-2.5 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="md:w-64 md:border-r border-b md:border-b-0 border-border p-2 md:p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2">
              <Bone className="w-8 h-8 rounded-lg" />
              <Bone className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Bone className="w-7 h-7 rounded-lg" />
          <Bone className="h-4 w-32" />
        </div>
        <div className="flex-1 px-4 py-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={cn("flex gap-3", i % 2 === 0 && "flex-row-reverse")}>
              <Bone className="w-7 h-7 rounded-lg shrink-0" />
              <Bone className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-64")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
