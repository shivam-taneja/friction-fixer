function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export const authConfig = {
  apiKey: required(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  ),
  cookieName: "ff-session",
  cookieSignatureKeys: [
    required("COOKIE_SECRET_KEY", process.env.COOKIE_SECRET_KEY),
  ],
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24, // 12 days
  },
  serviceAccount: {
    projectId: required(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    clientEmail: required(
      "FIREBASE_CLIENT_EMAIL",
      process.env.FIREBASE_CLIENT_EMAIL,
    ),
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },
};
