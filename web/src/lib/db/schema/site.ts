export type SiteRecord = {
  userId: string;
  url: string;
  domain: string;
  folder: string | null;
  installationId: string | null;
  repoFullName: string | null;
  ownership: {
    status: "pending" | "verified";
    method: "file" | "dns" | null;
    token: string;
    verifiedAt: unknown | null;
  };
  createdAt: unknown;
  updatedAt: unknown;
};
