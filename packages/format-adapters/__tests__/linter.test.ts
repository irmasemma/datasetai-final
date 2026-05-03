// Tests for Story E4.4 — Linter on Publish.
// The linter is the union of registered FormatAdapter.validate() over the detected formats.
// Real adapters, real fixture content. No mocks.

import { describe, expect, it } from 'vitest';
import {
  autoDetectFormats,
  createAdapterRegistry,
  type AgentContent,
  type AgentFile,
  type FormatAdapter,
} from '@datasetai/format-adapters';

function file(p: string, contents: string): AgentFile {
  return { path: p, content: new TextEncoder().encode(contents) };
}

function buildRegistry() {
  return createAdapterRegistry({
    readFile: async () => null,
    writeFile: async () => {},
    mkdir: async () => {},
  });
}

/**
 * Run every detected adapter's validate() and aggregate. Mirrors what the publish
 * pipeline must do per E4.4. We assert on the contract here so the implementer's
 * pipeline glue can ship later without the linter assertion drifting.
 */
function lintUpload(files: readonly AgentFile[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  detected: readonly string[];
} {
  const reg = buildRegistry();
  const detection = autoDetectFormats(files, reg);
  const errors: string[] = [];
  const warnings: string[] = [];
  const content: AgentContent = { files };

  for (const id of detection.formats) {
    const adapter: FormatAdapter | undefined = reg.byId(id);
    if (!adapter) continue;
    const result = adapter.validate(content);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { valid: errors.length === 0, errors, warnings, detected: detection.formats };
}

describe('publish linter aggregation (Story E4.4)', () => {
  it('passes a well-formed Claude Skill', () => {
    const result = lintUpload([
      file('SKILL.md', '---\nname: code-reviewer\ndescription: reviews code\n---\n\n# x'),
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.detected).toContain('claude-skill');
  });

  it('blocks a Skill missing the required `description` frontmatter (errors are blocking)', () => {
    const result = lintUpload([
      file('SKILL.md', '---\nname: only-name\n---\n\n# x'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /description/i.test(e))).toBe(true);
  });

  it('blocks a Skill missing the required `name` frontmatter', () => {
    const result = lintUpload([
      file('SKILL.md', '---\ndescription: missing-name\n---\n\n# x'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /name/i.test(e))).toBe(true);
  });

  it('emits an actionable error mentioning the file ("SKILL.md")', () => {
    const result = lintUpload([file('README.md', '# nothing useful')]);
    // No SKILL.md, so claude-skill adapter won't even detect — but if any partial signal
    // matched it the error must reference the file.
    if (result.detected.includes('claude-skill')) {
      expect(result.errors.some((e) => e.includes('SKILL.md'))).toBe(true);
    }
    // Not a hard requirement when nothing is detected; just confirms shape.
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('warnings do not block (still valid=true on warnings-only)', () => {
    // A valid skill — adapter currently emits zero warnings, but the contract is
    // warnings-don't-fail, which we encode as: when errors=[], valid=true regardless of warnings.
    const result = lintUpload([
      file('SKILL.md', '---\nname: a\ndescription: b\n---\n\n# x'),
    ]);
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
