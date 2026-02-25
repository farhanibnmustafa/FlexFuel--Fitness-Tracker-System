#!/usr/bin/env node
// Kills any process occupying the target port before the dev server starts.
import { execSync } from 'child_process';

const port = process.argv[2] || '3000';

try {
  const result = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
  if (result) {
    const pids = result.split('\n').filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`);
        console.log(`Killed process ${pid} on port ${port}`);
      } catch {
        // Process may have already exited
      }
    }
  }
} catch {
  // No process found on that port — nothing to kill
}
