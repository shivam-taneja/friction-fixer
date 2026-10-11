import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";

export function GithubConnectPrompt({
  authorizing,
  onConnect,
}: {
  authorizing: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-14 w-full cursor-pointer justify-start px-4"
        disabled={authorizing}
        onClick={onConnect}
      >
        <GithubIcon />
        {authorizing ? "Waiting for GitHub…" : "Connect GitHub"}
      </Button>
      <p className="text-xs text-muted-foreground">Connect one repository.</p>
    </div>
  );
}
