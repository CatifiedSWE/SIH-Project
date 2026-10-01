import { IAIProvider } from "./ai-provider.interface";
import { GemmaProvider } from "./gemma-provider";
import { HeuristicGemmaProvider } from "./heuristic-provider";

export * from "./ai-provider.interface";
export * from "./prompt-builder";
export * from "./gemma-provider";
export * from "./heuristic-provider";

/**
 * AI Provider Factory
 * Returns the configured AI extraction engine.
 * Defaults to Gemma with automatic fallback to heuristic engine.
 */
export function getAIProvider(): IAIProvider {
  const gemma = new GemmaProvider();
  if (gemma.isAvailable()) {
    return gemma;
  }
  return new HeuristicGemmaProvider();
}
