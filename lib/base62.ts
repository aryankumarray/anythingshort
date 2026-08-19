// cuid()s are for internal IDs (unguessable, collision-safe).
// Base62(sequence) is for public-facing short slugs (short, sequential, no collisions to check).

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = BigInt(62);

export function encode(num: bigint | number): string {
  let value = typeof num === "bigint" ? num : BigInt(num);

  if (value < 0n) {
    throw new Error("encode() expects a non-negative number");
  }

  if (value === 0n) {
    return ALPHABET[0]!;
  }

  let result = "";
  while (value > 0n) {
    const remainder = Number(value % BASE);
    result = ALPHABET[remainder]! + result;
    value /= BASE;
  }

  return result;
}

export function decode(str: string): bigint {
  if (str.length === 0) {
    throw new Error("decode() expects a non-empty string");
  }

  let result = 0n;

  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base62 character: ${char}`);
    }
    result = result * BASE + BigInt(index);
  }

  return result;
}

// Round-trip: encode(0) === "0", decode("0") === 0n
// Round-trip: encode(61) === "Z", decode("Z") === 61n
// Round-trip: encode(3844) === "100", decode("100") === 3844n
