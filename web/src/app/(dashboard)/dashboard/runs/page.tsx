import type { Metadata } from "next";
import { RunsPage } from "@/components/dashboard/runs-page";

const title = "Runs — Friction Fixer";
const description = "Start one agent round and follow the steps it saves.";

export const metadata: Metadata = {
  title,
  description,
};

export default function Page() {
  return <RunsPage />;
}
