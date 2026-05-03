// Claude Skill format adapter (story E3.3, Architecture AD-2).
// A Claude Skill is a folder rooted at `.claude/skills/<skill-name>/` containing a `SKILL.md`
// with frontmatter `name` + `description` plus optional supporting files.

import type { FormatId, ToolId } from '@datasetai/core';
import path from 'node:path';
import type {
  AgentContent,
  AgentFile,
  FormatAdapter,
  InstallResult,
} from './index.js';

export const CLAUDE_SKILL_FORMAT: FormatId = 'claude-skill';

const SKILL_FILE = 'SKILL.md';

function findSkillFile(files: readonly AgentFile[]): AgentFile | undefined {
  return files.find((f) => path.posix.basename(f.path).toLowerCase() === SKILL_FILE.toLowerCase());
}

function parseFrontmatter(text: string): Record<string, string> {
  const m = /^---\s*\n([\s\S]*?)\n---/m.exec(text);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const raw of (m[1] ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) out[key] = value;
  }
  return out;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

function deriveSkillName(content: AgentContent, fallback: string): string {
  const skillFile = findSkillFile(content.files);
  if (skillFile) {
    const fm = parseFrontmatter(bytesToString(skillFile.content));
    if (fm['name']) return fm['name'].toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  }
  return fallback;
}

export function createClaudeSkillAdapter(deps: {
  writeFile: (filePath: string, contents: Uint8Array) => Promise<void>;
  mkdir: (dir: string, options?: { recursive: boolean }) => Promise<void>;
  defaultSkillName?: string;
}): FormatAdapter {
  return {
    id: CLAUDE_SKILL_FORMAT,
    detect(files) {
      return findSkillFile(files) !== undefined;
    },
    validate(content) {
      const errors: string[] = [];
      const warnings: string[] = [];
      const skill = findSkillFile(content.files);
      if (!skill) {
        errors.push(`Missing ${SKILL_FILE} at root`);
        return { valid: false, errors, warnings };
      }
      const fm = parseFrontmatter(bytesToString(skill.content));
      if (!fm['name']) errors.push('SKILL.md frontmatter must include `name`');
      if (!fm['description']) errors.push('SKILL.md frontmatter must include `description`');
      return { valid: errors.length === 0, errors, warnings };
    },
    async install(content, target) {
      const skillName = deriveSkillName(content, deps.defaultSkillName ?? 'agent');
      const skillRoot = path.join(target.projectRoot, '.claude', 'skills', skillName);
      const written: string[] = [];
      await deps.mkdir(skillRoot, { recursive: true });
      for (const file of content.files) {
        const targetPath = path.join(skillRoot, file.path);
        await deps.mkdir(path.dirname(targetPath), { recursive: true });
        await deps.writeFile(targetPath, file.content);
        written.push(targetPath);
      }
      const result: InstallResult = {
        tool: target.tool,
        writtenPaths: written,
      };
      return result;
    },
    toolCompatibility(): readonly ToolId[] {
      return ['claude-code'];
    },
  };
}
