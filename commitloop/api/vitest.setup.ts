process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??=
  "postgresql://commitloop:commitloop@localhost:5432/commitloop";
process.env.MENTOR_GITHUB_IDS ??= "900001";
