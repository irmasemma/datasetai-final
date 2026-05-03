// Tests for Story E7.5 — Required License Field on Publish.
// Real lintPublish() against real adapter registry. No mocks.

import { describe, expect, it } from 'vitest';
import {
  createAdapterRegistry,
  lintPublish,
  type AgentFile,
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

const VALID_SKILL = file('SKILL.md', '---\nname: a\ndescription: b\n---\n\n# x');
const README = file('README.md', '# r');

describe('license required at publish (Story E7.5)', () => {
  it('errors with LICENSE_REQUIRED when license is empty string', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: '' },
      reg,
    );
    expect(lint.errors.some((e) => e.code === 'LICENSE_REQUIRED')).toBe(true);
  });

  it('errors with LICENSE_REQUIRED when license is null', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: null },
      reg,
    );
    expect(lint.errors.some((e) => e.code === 'LICENSE_REQUIRED')).toBe(true);
  });

  it('errors with LICENSE_NOT_ALLOWED for licenses outside the allow list', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: 'WTFPL' },
      reg,
    );
    expect(lint.errors.some((e) => e.code === 'LICENSE_NOT_ALLOWED')).toBe(true);
  });

  it('warns (does not block) when license is "None"', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: 'None' },
      reg,
    );
    expect(lint.errors.filter((e) => e.code.startsWith('LICENSE'))).toEqual([]);
    expect(lint.warnings.some((w) => w.code === 'LICENSE_AMBIGUOUS')).toBe(true);
  });

  it('warns (does not block) when license is "Custom"', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: 'Custom' },
      reg,
    );
    expect(lint.errors.filter((e) => e.code.startsWith('LICENSE'))).toEqual([]);
    expect(lint.warnings.some((w) => w.code === 'LICENSE_AMBIGUOUS')).toBe(true);
  });

  it('passes silently for an allowed SPDX id (MIT)', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README] }, formats: ['claude-skill'], license: 'MIT' },
      reg,
    );
    expect(lint.errors).toEqual([]);
    expect(lint.warnings.filter((w) => w.code === 'LICENSE_AMBIGUOUS')).toEqual([]);
  });

  it('lint blocks when an executable file is uploaded (E4.4 EXECUTABLE_FORBIDDEN)', () => {
    const reg = buildRegistry();
    const exe: AgentFile = { path: 'tool.exe', content: new Uint8Array([0x4d, 0x5a]) };
    const lint = lintPublish(
      { content: { files: [VALID_SKILL, README, exe] }, formats: ['claude-skill'], license: 'MIT' },
      reg,
    );
    expect(lint.errors.some((e) => e.code === 'EXECUTABLE_FORBIDDEN')).toBe(true);
  });

  it('lint warns README_MISSING when no readme is present', () => {
    const reg = buildRegistry();
    const lint = lintPublish(
      { content: { files: [VALID_SKILL] }, formats: ['claude-skill'], license: 'MIT' },
      reg,
    );
    expect(lint.warnings.some((w) => w.code === 'README_MISSING')).toBe(true);
  });
});
