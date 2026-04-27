/**
 * Perforce client wrapper — stub for W1–2.
 * The real implementation arrives with Bridge Track B-2 (Sync 1).
 */

import { env } from '$env/dynamic/private';

export interface P4Config {
  port: string;
  user: string;
  depot: string;
}

export interface P4ChangelistSummary {
  changelist: number;
  user: string;
  description: string;
  files: string[];
  submittedAt: string;
}

export interface P4FileDiff {
  path: string;
  hunks: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
}

function loadConfig(): P4Config {
  return {
    port: env.P4PORT ?? process.env.P4PORT ?? '',
    user: env.P4USER ?? process.env.P4USER ?? '',
    depot: env.P4DEPOT ?? process.env.P4DEPOT ?? ''
  };
}

export class P4Client {
  readonly config: P4Config;

  constructor(config?: Partial<P4Config>) {
    this.config = { ...loadConfig(), ...config };
  }

  async getChangelist(_changelist: number): Promise<P4ChangelistSummary> {
    throw new Error('P4Client.getChangelist not implemented (Bridge Sync 1)');
  }

  async getDiff(_changelist: number): Promise<P4FileDiff[]> {
    throw new Error('P4Client.getDiff not implemented (Bridge Sync 1)');
  }

  async listRecentChangelists(_limit = 50): Promise<P4ChangelistSummary[]> {
    throw new Error(
      'P4Client.listRecentChangelists not implemented (Bridge Sync 1)'
    );
  }
}

export const p4 = new P4Client();
