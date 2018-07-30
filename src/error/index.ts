export const ErrorCode: { [keys: string]: number } = Object.freeze({
  None: 0,
  EnviromentVariableMissing: 1,
  RuntimeNotSupported: 2
});

export function exit(code: number) {
  console.log(`error(${code})`);
  process.exit(code);
}
