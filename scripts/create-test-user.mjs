// Creates a local test account through the app's normal sign-up endpoint.
// Usage (dev server running): npm run test-user
//
// Local development only: refuses to run against anything but localhost.
// Test login:
export const TEST_USER = {
  email: "test@fitness.local",
  password: "test-UDbd3x1nv2Oj",
  name: "Test User",
};

const base = process.env.APP_URL ?? "http://localhost:3000";
const { hostname } = new URL(base);
if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
  console.error(`Refusing to create a test user on ${base} (localhost only).`);
  process.exit(1);
}

const res = await fetch(`${base}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify(TEST_USER),
});

if (res.ok) {
  console.log(`Created test user ${TEST_USER.email} (password is in scripts/create-test-user.mjs).`);
} else {
  const body = await res.json().catch(() => ({}));
  if (res.status === 422 || /exist/i.test(body.message ?? "")) {
    console.log(`Test user ${TEST_USER.email} already exists.`);
  } else {
    console.error(`Sign-up failed (${res.status}): ${body.message ?? "unknown error"}`);
    process.exit(1);
  }
}
