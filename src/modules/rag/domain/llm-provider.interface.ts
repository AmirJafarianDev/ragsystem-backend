export const LLM_CHAT_PROVIDER = Symbol('LLM_CHAT_PROVIDER');

export interface ILlmChatProvider {
  /**
   * Generates a chat completion given a system prompt and user question
   */
  generateAnswer(
    systemPrompt: string,
    userQuestion: string,
    temperature?: number,
  ): Promise<string>;
}
