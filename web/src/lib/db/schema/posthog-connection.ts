export type PosthogConnectionRecord = {
  userId: string;
  projectId: string;
  projectName: string;
  apiHost: string;
  refreshToken: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export type PosthogConnectionStatus =
  | { connected: false }
  | {
      connected: true;
      projectId: string;
      projectName: string;
      apiHost: string;
    };
