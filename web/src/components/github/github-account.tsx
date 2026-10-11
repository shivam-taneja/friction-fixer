import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function GithubAccount({
  login,
  authorizing,
  disconnecting,
  onChange,
  onDisconnect,
}: {
  login: string;
  authorizing: boolean;
  disconnecting: boolean;
  onChange: () => void;
  onDisconnect: () => void;
}) {
  const initial = login.slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="lg">
          <AvatarImage
            src={`https://github.com/${encodeURIComponent(login)}.png`}
            alt=""
          />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{login}</p>
          <p className="mt-1 text-sm text-muted-foreground">GitHub connected</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          disabled={authorizing || disconnecting}
          onClick={onChange}
          className="cursor-pointer"
        >
          {authorizing ? "Waiting…" : "Change"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={authorizing || disconnecting}
          onClick={onDisconnect}
          className="cursor-pointer"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </Button>
      </div>
    </div>
  );
}
