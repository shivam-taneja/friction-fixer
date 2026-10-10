import { Check, FileText, Globe } from "lucide-react";
import type { OwnershipMethod } from "@/components/onboarding/logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function WebsiteStep({
  site,
  onSiteChange,
  domain,
  method,
  onMethodChange,
  token,
  verified,
  checking,
  onVerify,
}: {
  site: string;
  onSiteChange: (value: string) => void;
  domain: string | null;
  method: OwnershipMethod;
  onMethodChange: (method: OwnershipMethod) => void;
  token: string;
  verified: boolean;
  checking: boolean;
  onVerify: () => void;
}) {
  return (
    <div className="grid gap-6">
      <label className="grid text-sm font-medium">
        Website URL
        <input
          autoFocus
          className={inputClass}
          type="text"
          inputMode="url"
          placeholder="https://yourwebsite.com"
          value={site}
          onChange={(event) => onSiteChange(event.target.value)}
        />
        <span className="mt-2 text-xs font-normal text-muted-foreground">
          The website you want to improve.
        </span>
      </label>

      {domain && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Prove you own {domain}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Add a file or a DNS record. This check is simulated for now.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(
              [
                { id: "file", label: "HTML file", icon: FileText },
                { id: "dns", label: "DNS record", icon: Globe },
              ] as const
            ).map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                aria-pressed={method === option.id}
                className={cn(
                  "h-11",
                  method === option.id && "border-foreground bg-secondary",
                )}
                onClick={() => onMethodChange(option.id)}
              >
                <option.icon />
                {option.label}
              </Button>
            ))}
          </div>
          {method === "file" ? (
            <ol className="mt-4 grid gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                Upload a text file to{" "}
                <code className="text-foreground">
                  {domain}/.well-known/friction-fixer.txt
                </code>
              </li>
              <li>
                Put this token in the file:{" "}
                <code className="text-foreground">{token}</code>
              </li>
            </ol>
          ) : (
            <ol className="mt-4 grid gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                Add a TXT record on{" "}
                <code className="text-foreground">
                  _friction-fixer.{domain}
                </code>
              </li>
              <li>
                Set the value to{" "}
                <code className="text-foreground">{token}</code>
              </li>
            </ol>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            {verified ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <Check size={16} />
                Domain verified
              </p>
            ) : (
              <span className="text-xs text-muted-foreground">
                Waiting for a check.
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={checking || verified}
              onClick={onVerify}
            >
              {checking ? "Checking…" : verified ? "Verified" : "Verify domain"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
