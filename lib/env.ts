const REQUIRED_SERVER_ENV = [
  "MONGODB_URI",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

export function assertServerEnv() {
  for (const name of REQUIRED_SERVER_ENV) {
    readRequired(name);
  }

  const secret = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  if (secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET en az 32 karakter olmalı.");
  }
}

export function getMongodbUri() {
  return readRequired("MONGODB_URI");
}
