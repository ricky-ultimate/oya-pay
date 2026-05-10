"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Project, ProjectStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/utils/format";
import { PROJECT_STATUS_CONFIG } from "@/utils/constants";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function CollectionProgress({
  collected,
  total,
}: {
  collected: number;
  total: number;
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-success-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-neutral-500 tabular-nums w-8 text-right flex-shrink-0">
        {pct}%
      </span>
    </div>
  );
}

export default function ProjectsPage() {
  const [status, setStatus] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects", status],
    queryFn: () => api.getProjects(status || undefined),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-neutral-900 tracking-tight"
            style={{ letterSpacing: "-0.5px" }}
          >
            Projects
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {isLoading
              ? "Loading..."
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/projects/create">
          <Button size="md">New project</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex flex-nowrap gap-1 overflow-x-auto scrollbar-none">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={[
                "flex-shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all",
                status === opt.value
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description={
              status
                ? "No projects match this filter."
                : "Create your first project to group invoices by engagement."
            }
            action={
              !status ? (
                <Link href="/projects/create">
                  <Button>New project</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {projects.map((project) => {
              const totalForBar = project.totalValue
                ? Math.max(
                    Number(project.totalValue),
                    project.totalInvoiced ?? 0,
                  )
                : (project.totalInvoiced ?? 0);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50/80 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0 ring-1 ring-primary-100">
                    {project.name[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {project.name}
                      </p>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {project.client.name} &middot; {project.invoiceCount ?? 0}{" "}
                      invoice
                      {(project.invoiceCount ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
                    <CollectionProgress
                      collected={project.totalCollected ?? 0}
                      total={totalForBar}
                    />
                    <p className="text-xs text-neutral-400">
                      {formatNaira(project.totalCollected ?? 0)} collected
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-neutral-900 tabular-nums">
                      {project.outstanding && project.outstanding > 0
                        ? formatNaira(project.outstanding)
                        : formatNaira(project.totalCollected ?? 0)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {project.outstanding && project.outstanding > 0
                        ? "outstanding"
                        : "collected"}
                    </p>
                  </div>

                  <svg
                    className="w-4 h-4 text-neutral-300 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
