const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function WebsiteStep({
  site,
  onSiteChange,
}: {
  site: string;
  onSiteChange: (value: string) => void;
}) {
  return (
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
  );
}
