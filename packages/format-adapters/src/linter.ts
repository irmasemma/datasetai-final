// Publish-time linter (story E4.4 + E4.5 + E7.5).
// Errors block publish; warnings are surfaced but non-blocking.
// License is REQUIRED at publish time per E7.5; the dropdown enforces this client-side, the
// linter enforces it server-side.

import type { FormatId } from '@datasetai/core';
import path from 'node:path';
import type { AgentContent, AdapterRegistry } from './index.js';

export interface LintMessage {
  readonly level: 'error' | 'warning';
  readonly code: string;
  readonly message: string;
  readonly file?: string;
}

export interface LintReport {
  readonly errors: readonly LintMessage[];
  readonly warnings: readonly LintMessage[];
}

export const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'GPL-3.0',
  'AGPL-3.0',
  'LGPL-3.0',
  'BSL-1.1',
  'Custom',
  'None',
] as const;

export type AllowedLicense = (typeof ALLOWED_LICENSES)[number];

const EXECUTABLE_EXTENSIONS = ['.exe', '.dll', '.so', '.dylib', '.msi', '.bat', '.cmd', '.com'];

export interface LintInput {
  readonly content: AgentContent;
  readonly formats: readonly FormatId[];
  readonly license: string | null | undefined;
}

export function lintPublish(input: LintInput, registry: AdapterRegistry): LintReport {
  const errors: LintMessage[] = [];
  const warnings: LintMessage[] = [];

  if (!input.license || input.license.trim() === '') {
    errors.push({
      level: 'error',
      code: 'LICENSE_REQUIRED',
      message: 'License is required. Pick an SPDX id, "Custom", or "None".',
    });
  } else if (!ALLOWED_LICENSES.includes(input.license as AllowedLicense)) {
    errors.push({
      level: 'error',
      code: 'LICENSE_NOT_ALLOWED',
      message: `License "${input.license}" is not in the allow list.`,
    });
  } else if (input.license === 'None' || input.license === 'Custom') {
    warnings.push({
      level: 'warning',
      code: 'LICENSE_AMBIGUOUS',
      message:
        'Listing license is set to None or Custom — visitors will see a warning banner.',
    });
  }

  if (input.formats.length === 0) {
    errors.push({
      level: 'error',
      code: 'FORMAT_UNDETECTED',
      message: 'No format detected and none selected. Pick a format manually.',
    });
  }

  let hasReadme = false;
  for (const file of input.content.files) {
    const base = path.posix.basename(file.path).toLowerCase();
    if (base === 'readme.md' || base === 'readme') hasReadme = true;
    const ext = path.posix.extname(base);
    if (EXECUTABLE_EXTENSIONS.includes(ext)) {
      errors.push({
        level: 'error',
        code: 'EXECUTABLE_FORBIDDEN',
        file: file.path,
        message: `Executable file ${file.path} is not allowed in agent content.`,
      });
    }
  }
  if (!hasReadme) {
    warnings.push({
      level: 'warning',
      code: 'README_MISSING',
      message: 'No README.md at content root — listings render better with one.',
    });
  }

  for (const formatId of input.formats) {
    const adapter = registry.byId(formatId);
    if (!adapter) {
      errors.push({
        level: 'error',
        code: 'FORMAT_UNKNOWN',
        message: `No adapter registered for format ${formatId}.`,
      });
      continue;
    }
    const v = adapter.validate(input.content);
    for (const msg of v.errors) {
      errors.push({
        level: 'error',
        code: 'ADAPTER_VALIDATE',
        message: `${formatId}: ${msg}`,
      });
    }
    for (const msg of v.warnings) {
      warnings.push({
        level: 'warning',
        code: 'ADAPTER_VALIDATE',
        message: `${formatId}: ${msg}`,
      });
    }
  }

  return { errors, warnings };
}

const MIRROR_DENY_LICENSES = ['Proprietary', 'Commercial-only', 'Commercial', 'Closed'];

export function isMirrorAllowedLicense(spdxId: string | null | undefined): boolean {
  if (!spdxId) return false;
  return !MIRROR_DENY_LICENSES.some((d) => d.toLowerCase() === spdxId.toLowerCase());
}
