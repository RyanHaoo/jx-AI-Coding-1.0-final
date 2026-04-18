import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const connectionString = process.env.DATABASE_URL;

let _checkpointer: PostgresSaver | null = null;
let _setupPromise: Promise<void> | null = null;

export function getCheckpointer(): PostgresSaver {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Set it to your Supabase Transaction Pooler URL to enable agent checkpoints.",
    );
  }
  if (!_checkpointer) {
    _checkpointer = PostgresSaver.fromConnString(connectionString);
  }
  return _checkpointer;
}

export function ensureCheckpointerReady(): Promise<void> {
  const checkpointer = getCheckpointer();
  if (!_setupPromise) {
    _setupPromise = checkpointer.setup().catch((err) => {
      _setupPromise = null;
      throw err;
    });
  }
  return _setupPromise;
}
