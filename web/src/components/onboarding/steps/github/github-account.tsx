import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function GithubAccount({
  login,
  authorizing,
  onChange,
}: {
  login: string;
  authorizing: boolean;
  onChange: () => void;
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
      <Button
        type="button"
        variant="ghost"
        disabled={authorizing}
        onClick={onChange}
        className="cursor-pointer"
      >
        {authorizing ? "Waiting…" : "Change"}
      </Button>
    </div>
  );
}
