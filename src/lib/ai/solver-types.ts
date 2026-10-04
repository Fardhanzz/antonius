import { SolverInput, SolverOutput } from '@/lib/validation/solver-schema';

export * from '@/lib/validation/solver-schema';

/**
 * Interface contract for AI Solver providers.
 * All solving algorithms and external LLM providers must implement this contract.
 */
export interface ISolverProvider {
  name: string;
  solve(input: SolverInput): Promise<SolverOutput>;
}
