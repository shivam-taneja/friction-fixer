"use client";

import { useState } from "react";
import { ArrowRight, Check, GitPullRequest, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/components/dashboard/use-workspace";
import type { Change, ChangeFilter } from "@/components/dashboard/workspace";

export function ChangeList({
  limit,
  filter = "All",
}: {
  limit?: number;
  filter?: ChangeFilter | string;
}) {
  const { changes, setChanges } = useWorkspace();
  const [selected, setSelected] = useState<Change | null>(null);

  const update = (status: Change["status"]) => {
    if (!selected) return;
    setChanges((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, status } : item,
      ),
    );
    setSelected(null);
  };

  const rows = changes
    .filter((item) => filter === "All" || item.status === filter)
    .slice(0, limit);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Change</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">
              Conversion lift
            </TableHead>
            <TableHead>
              <span className="sr-only">Open change</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-normal">
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start p-0 text-left whitespace-normal hover:bg-transparent"
                  onClick={() => setSelected(item)}
                >
                  <GitPullRequest className="shrink-0 text-muted-foreground" />
                  <span>
                    <strong className="block text-xs font-medium">
                      {item.title}
                    </strong>
                    <small className="mt-1 block text-muted-foreground">
                      #{item.id} • {item.page}
                    </small>
                  </span>
                </Button>
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.status === "Review" ? "default" : "secondary"}
                  className={
                    item.status === "Kept"
                      ? "text-success"
                      : item.status === "Measuring"
                        ? "text-signal"
                        : ""
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell
                className={`hidden sm:table-cell ${item.status === "Reverted" ? "text-muted-foreground" : "text-success"}`}
              >
                {item.lift}
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Open change ${item.id}`}
                  title="Open change"
                  onClick={() => setSelected(item)}
                >
                  <ArrowRight />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                No changes here yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              Pull request #{selected?.id} • {selected?.page}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed">{selected?.detail}</p>
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-2 border-y border-border py-4 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{selected?.status}</dd>
            <dt className="text-muted-foreground">Conversion lift</dt>
            <dd className="font-medium">{selected?.lift}</dd>
          </dl>
          <div className="flex flex-wrap justify-end gap-2">
            {selected?.status === "Review" && (
              <>
                <Button variant="outline" onClick={() => update("Reverted")}>
                  Dismiss
                </Button>
                <Button variant="hero" onClick={() => update("Measuring")}>
                  <Check />
                  Approve change
                </Button>
              </>
            )}
            {(selected?.status === "Kept" ||
              selected?.status === "Measuring") && (
              <Button variant="outline" onClick={() => update("Reverted")}>
                <RotateCcw />
                Revert change
              </Button>
            )}
            {selected?.status === "Reverted" && (
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
