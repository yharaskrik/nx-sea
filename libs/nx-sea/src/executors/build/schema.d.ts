export interface SeaBuildExecutorSchema {
  entryPoint: string;
  directory: string;
  nodePath?: string;
  removeSignature: boolean;
}
