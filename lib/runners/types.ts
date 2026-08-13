export type RunnerStatus = "passed" | "failed" | "error";

export interface RunnerAdapter<Input, Output> {
  readonly runtime: string;
  readonly version: string;
  execute(input: Input): Promise<Output>;
}
