"use client";

import { useEffect, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";

interface SystemLogEntry {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

function SystemLogItem({ log }: { log: SystemLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card group hover:bg-secondary/10 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between p-4 md:p-6 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
          <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-widest hidden md:block w-[100px] shrink-0">
            {new Date(log.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "2-digit"
            })}
          </span>
          <span className="px-2 py-[0.15rem] text-[0.6rem] uppercase tracking-widest font-bold bg-foreground text-background shrink-0">
            Registration
          </span>
          <span className="font-serif text-lg md:text-xl text-foreground truncate">
            {log.name || log.email || "Anonymous Event"}
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6 shrink-0 ml-4">
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-medium hidden sm:block truncate">
            {log.role.replace("_", " ")}
          </span>
          <IconChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-foreground/[0.02] p-6 lg:p-8 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-medium">
                Identity Profile
              </span>
              <span className="text-sm font-serif text-foreground">
                {log.name || "Anonymous Entity"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {log.email}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-medium">
                System Role
              </span>
              <span className="text-sm font-medium text-foreground">
                {log.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-medium">
                Detailed Timestamp
              </span>
              <span className="text-sm font-mono tracking-tight text-foreground">
                {new Date(log.createdAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {new Date(log.createdAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-medium hidden lg:block">
                Action Status
              </span>
              <span className="mt-auto px-3 py-1.5 border border-border bg-card text-[0.65rem] tracking-widest uppercase font-bold text-foreground inline-flex items-center justify-center">
                SUCCESS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SystemLog() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          // Assuming the stats endpoint returns recentRegistrations
          setLogs(data.recentRegistrations || []);
        }
      } catch (error) {
        console.error("Failed to fetch system logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-12 pb-12 animate-in fade-in duration-1000">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-none tracking-tight">
              System
              <br />
              <span className="italic text-muted-foreground">Activity Log</span>
            </h1>
            <p className="max-w-xl text-sm uppercase tracking-widest text-muted-foreground font-medium animate-pulse">
              Loading recent system activity...
            </p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-none tracking-tight">
            System
            <br />
            <span className="italic text-muted-foreground">Activity Log</span>
          </h1>
          <p className="max-w-xl text-sm uppercase tracking-widest text-foreground font-medium">
            Review recent registrations and critical platform events
          </p>
        </div>
      </header>

      {logs.length > 0 ? (
        <section className="bg-card border border-border">
          <div className="p-6 md:p-8 border-b border-border flex justify-between items-end bg-card">
            <div>
              <h2 className="text-3xl font-serif italic text-foreground">
                Recent Entities
              </h2>
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mt-3 font-medium">
                Showing {logs.length} latest events
              </p>
            </div>
          </div>
          
          <div className="border-border flex flex-col divide-y divide-border">
            {logs.map((log) => (
              <SystemLogItem key={log.id} log={log} />
            ))}
          </div>
        </section>
      ) : (
        <div className="border border-border bg-card p-8 md:p-12">
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-medium">
            No recent system activity found.
          </p>
        </div>
      )}
    </div>
  );
}
