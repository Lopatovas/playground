export function isTestFile(file: string): boolean {
  return /\.(test|spec)\./.test(file);
}

export function fileBasename(file: string): string {
  return file.split("/").pop() ?? file;
}
