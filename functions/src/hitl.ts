
import { Config, ApprovalMode, Storage, loadSkillsFromDir } from '@google/gemini-cli-core';

export async function processHitlMessage(
  _history: any[],
  newMessage: string,
  targetDir: string,
  skillsDir: string
) {
  const sessionId = `session-${Date.now()}`;
  const storage = new Storage(targetDir, sessionId);
  await storage.initialize();

  const config = new Config({
    sessionId,
    targetDir,
    cwd: targetDir,
    model: 'gemini-2.5-flash',
    debugMode: true,
    approvalMode: ApprovalMode.PLAN, // HITL mode
    plan: true,
    skillsSupport: true,
  });

  await config.initialize();
  
  // Load skills
  await loadSkillsFromDir(skillsDir);

  const client = config.getGeminiClient();
  await client.initialize();

  const response = await client.generateContent('default' as any, [
    { role: 'user', parts: [{ text: newMessage }] }
  ], new AbortController().signal, 'main' as any);

  return response;
}
