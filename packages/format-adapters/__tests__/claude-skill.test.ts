// Tests for Story E3.3 — claude-skill format adapter (Architecture AD-2).
// Adapter contract: detect(files), validate(content), install(content, target),
// toolCompatibility() returns ['claude-code'].

import { describe, expect, it, vi } from 'vitest';
import {
  createClaudeSkillAdapter,
  type AgentContent,
  type AgentFile,
  type ToolTarget,
} from '@datasetai/format-adapters';

function file(path: string, content: string): AgentFile {
  return { path, content: new TextEncoder().encode(content) };
}

const VALID_SKILL = `---
name: code-reviewer
description: Reviews code constructively
---

# Code Reviewer
Body content.`;

function makeAdapter(overrides: Partial<{
  writeFile: ReturnType<typeof vi.fn>;
  mkdir: ReturnType<typeof vi.fn>;
}> = {}) {
  const writeFile = overrides.writeFile ?? vi.fn().mockResolvedValue(undefined);
  const mkdir = overrides.mkdir ?? vi.fn().mockResolvedValue(undefined);
  const adapter = createClaudeSkillAdapter({ writeFile, mkdir });
  return { adapter, writeFile, mkdir };
}

describe('claude-skill adapter (Story E3.3)', () => {
  it("id is 'claude-skill'", () => {
    expect(makeAdapter().adapter.id).toBe('claude-skill');
  });

  it("toolCompatibility() returns ['claude-code']", () => {
    expect(makeAdapter().adapter.toolCompatibility()).toEqual(['claude-code']);
  });

  it('detect() returns true when SKILL.md is present', () => {
    const { adapter } = makeAdapter();
    const result = adapter.detect([
      file('README.md', '# readme'),
      file('SKILL.md', VALID_SKILL),
    ]);
    expect(result).toBe(true);
  });

  it('detect() returns false without SKILL.md', () => {
    const { adapter } = makeAdapter();
    expect(adapter.detect([file('README.md', '# readme')])).toBe(false);
  });

  it('validate() rejects content missing the SKILL.md file', () => {
    const { adapter } = makeAdapter();
    const result = adapter.validate({ files: [file('README.md', 'x')] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SKILL.md'))).toBe(true);
  });

  it('validate() rejects missing `name` frontmatter', () => {
    const { adapter } = makeAdapter();
    const skill = `---\ndescription: only desc\n---\n\n# x`;
    const result = adapter.validate({ files: [file('SKILL.md', skill)] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /name/.test(e))).toBe(true);
  });

  it('validate() rejects missing `description` frontmatter', () => {
    const { adapter } = makeAdapter();
    const skill = `---\nname: only-name\n---\n\n# x`;
    const result = adapter.validate({ files: [file('SKILL.md', skill)] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /description/.test(e))).toBe(true);
  });

  it('validate() accepts a well-formed SKILL.md', () => {
    const { adapter } = makeAdapter();
    const result = adapter.validate({ files: [file('SKILL.md', VALID_SKILL)] });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('install() writes files under <projectRoot>/.claude/skills/<name>/', async () => {
    const { adapter, writeFile, mkdir } = makeAdapter();
    const target: ToolTarget = {
      tool: 'claude-code',
      projectRoot: '/proj',
      homeDir: '/home/u',
    };
    const content: AgentContent = {
      files: [file('SKILL.md', VALID_SKILL), file('helpers/helper.md', 'help')],
    };
    const result = await adapter.install(content, target);

    expect(result.tool).toBe('claude-code');
    expect(result.writtenPaths.length).toBe(2);
    // All paths under .claude/skills
    expect(
      result.writtenPaths.every((p) => p.includes('.claude') && p.includes('skills')),
    ).toBe(true);
    // Skill name comes from frontmatter `name` field.
    expect(result.writtenPaths.every((p) => p.includes('code-reviewer'))).toBe(true);
    // Adapter must call mkdir at least once (for the skill root) and writeFile per file.
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledTimes(2);
  });
});
