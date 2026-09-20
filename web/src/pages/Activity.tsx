import { useState } from "react";

import { useActivity } from "../api/hooks";
import { Card, EmptyState, SkeletonLines } from "../components/ui";
import { ActivityList } from "./Overview";

const FILTERS = ["All", "CREATE", "UPDATE", "DELETE", "LOGIN"] as const;

export function Activity() {
  const { data: entries, isLoading } = useActivity();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible = (entries ?? []).filter((entry) => filter === "All" || entry.action === filter);

  return (
    <Card
      title="Audit trail"
      actions={
        <div className="segmented" role="group" aria-label="Filter activity">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active" : ""}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "All" ? "All" : value.charAt(0) + value.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <SkeletonLines count={8} />
      ) : visible.length === 0 ? (
        <EmptyState title="No matching activity" message="Try a different filter." />
      ) : (
        <ActivityList entries={visible} />
      )}
    </Card>
  );
}
