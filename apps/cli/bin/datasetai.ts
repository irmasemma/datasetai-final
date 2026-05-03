#!/usr/bin/env node
// datasetai CLI entry — `npx datasetai <command>`.
// Phase 0 ships scaffolding only; real commands ship in E3.1+.

import { run } from '../src/index.js';

const args = process.argv.slice(2);
const exitCode = await run(args);
process.exit(exitCode);
