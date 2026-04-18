import { ChatOpenAI } from "@langchain/openai";

export const model = new ChatOpenAI({
  model: process.env.AGENT_MODEL_ID ?? "",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  configuration: { baseURL: process.env.OPENROUTER_BASE_URL },
});
