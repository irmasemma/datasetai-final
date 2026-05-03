// @datasetai/source-adapters — auto-mirror SourceAdapter contract + implementations.
// Architecture: AD-3.

export * from './types.js';
export { sha256Hex } from './hash.js';
export {
  createVoltAgentAdapter,
  parseVoltAgentReadme,
  type VoltAgentAdapterOptions,
} from './voltagent.js';
export {
  createAlirezarezvaniAdapter,
  extractSkillFolders,
  type AlirezarezvaniAdapterOptions,
} from './alirezarezvani.js';
export {
  createSmitheryAdapter,
  type SmitheryAdapterOptions,
} from './smithery.js';
export {
  createPromptsChatAdapter,
  parseCsv,
  type PromptsChatAdapterOptions,
} from './promptschat.js';
