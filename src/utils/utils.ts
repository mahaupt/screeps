const hexChars = "0123456789abcdef";
export function randomHex(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return result;
}
