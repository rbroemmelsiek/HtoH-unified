type PingVertexResult = {
  ok: boolean;
  text?: string;
  error?: string;
  endpoint: string;
};

const DEFAULT_FUNCTION_URL =
  "https://us-central1-htoh-3-0.cloudfunctions.net/pingVertex";

async function checkVertexConnection(): Promise<PingVertexResult> {
  const endpoint = process.env.PING_VERTEX_URL ?? DEFAULT_FUNCTION_URL;

  try {
    const response = await fetch(endpoint, {cache: "no-store"});
    const payload = (await response.json()) as {ok?: boolean; text?: string; error?: string};

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? `HTTP ${response.status}`,
        endpoint,
      };
    }

    return {
      ok: Boolean(payload.ok),
      text: payload.text ?? "",
      endpoint,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      endpoint,
    };
  }
}

export default async function Home() {
  const result = await checkVertexConnection();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">HomeToHome Next.js + Functions + Vertex</h1>
      <p className="text-sm text-zinc-600">
        This page checks the Firebase Function <code>pingVertex</code> from the Next.js server.
      </p>

      <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-xl font-medium">Backend Health</h2>
        <p className="mb-2 text-sm text-zinc-600">
          Function endpoint: <code>{result.endpoint}</code>
        </p>
        <p className={result.ok ? "font-medium text-green-700" : "font-medium text-red-700"}>
          {result.ok ? `Connected: ${result.text}` : `Failed: ${result.error ?? "Unknown error"}`}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-xl font-medium">Local Development Note</h2>
        <p className="text-sm text-zinc-600">
          To test with local Functions emulator, set <code>PING_VERTEX_URL</code> in
          <code> frontend/.env.local</code> to:
          <br />
          <code>http://127.0.0.1:5001/htoh-3-0/us-central1/pingVertex</code>
        </p>
      </section>
    </main>
  );
}
