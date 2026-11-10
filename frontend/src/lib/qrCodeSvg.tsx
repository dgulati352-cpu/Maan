// Client-side pure mathematical QR code SVG generator (zero network calls, 100% React 19 compatible)
import React from "react";

// Galois Field GF(256) arithmetic for Reed-Solomon error correction
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < ecCount; i++) {
      res[i] ^= gfMul(gen[i], factor);
    }
  }
  return res;
}

// Version table for ECC Level L: [version, totalCodewords, dataCodewords, ecCodewords, numBlocks, alignmentPos]
interface VersionInfo {
  version: number;
  total: number;
  data: number;
  ec: number;
  blocks: number;
  align: number[];
}

const VERSION_INFO: (VersionInfo | null)[] = [
  null,
  { version: 1, total: 26, data: 19, ec: 7, blocks: 1, align: [] },
  { version: 2, total: 44, data: 34, ec: 10, blocks: 1, align: [6, 18] },
  { version: 3, total: 70, data: 55, ec: 15, blocks: 1, align: [6, 22] },
  { version: 4, total: 100, data: 80, ec: 20, blocks: 1, align: [6, 26] },
  { version: 5, total: 134, data: 108, ec: 26, blocks: 1, align: [6, 30] },
  { version: 6, total: 172, data: 136, ec: 18, blocks: 2, align: [6, 34] },
];

export function encodeToQrMatrix(text: string): { matrix: boolean[][]; size: number } {
  // Convert string to UTF-8 byte array
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  let chosenVersion: VersionInfo | null = null;
  for (let v = 1; v < VERSION_INFO.length; v++) {
    const info = VERSION_INFO[v];
    if (!info) continue;
    // 4 bits mode + 8 bits char count + data bytes
    const neededBits = 4 + 8 + bytes.length * 8;
    if (neededBits <= info.data * 8) {
      chosenVersion = info;
      break;
    }
  }
  if (!chosenVersion) {
    chosenVersion = VERSION_INFO[VERSION_INFO.length - 1]!;
  }

  const { version, data: dataCapacity, ec: ecCount, blocks } = chosenVersion;
  const size = version * 4 + 17;

  // Build bitstream
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count: 8 bits for versions 1-9
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }
  // Terminator
  const totalDataBits = dataCapacity * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, termLen);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // Alternate pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bits[i + j];
    }
    dataCodewords.push(byteVal);
  }

  // Generate EC codewords per block
  let finalCodewords: number[] = [];
  if (blocks === 1) {
    const ec = rsComputeRemainder(dataCodewords, ecCount);
    finalCodewords = dataCodewords.concat(ec);
  } else {
    const blockDataLen = Math.floor(dataCapacity / blocks);
    const blockEcLen = ecCount;
    const blockData: number[][] = [];
    const blockEc: number[][] = [];
    for (let b = 0; b < blocks; b++) {
      const bData = dataCodewords.slice(b * blockDataLen, (b + 1) * blockDataLen);
      blockData.push(bData);
      blockEc.push(rsComputeRemainder(bData, blockEcLen));
    }
    // Interleave data
    for (let i = 0; i < blockDataLen; i++) {
      for (let b = 0; b < blocks; b++) {
        finalCodewords.push(blockData[b][i]);
      }
    }
    // Interleave EC
    for (let i = 0; i < blockEcLen; i++) {
      for (let b = 0; b < blocks; b++) {
        finalCodewords.push(blockEc[b][i]);
      }
    }
  }

  // Initialize matrix
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean, func: boolean = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (func) isFunction[r][c] = true;
    }
  }

  // Place 7x7 Finder Pattern with 1-module border
  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(row, col, false);
        } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          setModule(row, col, true);
        } else {
          setModule(row, col, false);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (!isFunction[6][i]) setModule(6, i, val);
    if (!isFunction[i][6]) setModule(i, 6, val);
  }

  // Alignment patterns
  if (chosenVersion.align.length > 0) {
    const coords = chosenVersion.align;
    for (const r of coords) {
      for (const c of coords) {
        if (isFunction[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isEdge || isCenter);
          }
        }
      }
    }
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Reserve format areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setModule(8, i, false);
    if (!isFunction[i][8]) setModule(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) setModule(8, i, false);
    if (!isFunction[i][8]) setModule(i, 8, false);
  }

  // Convert final codewords to bit array
  const allDataBits: number[] = [];
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      allDataBits.push((byte >>> i) & 1);
    }
  }

  // Zigzag placement
  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          let bit = bitIdx < allDataBits.length ? allDataBits[bitIdx++] : 0;
          // Apply Mask 0: (row + col) % 2 === 0
          if ((r + c) % 2 === 0) {
            bit ^= 1;
          }
          matrix[r][c] = bit === 1;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info: ECC Level L + Mask 0 with standard BCH (15, 5) masked with 0x5412 = 0x77C4
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  // Place format info around top-left
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  // Place format info around top-right and bottom-left
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = formatBits[i] === 1;
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = formatBits[i] === 1;

  return { matrix, size };
}

export interface QrCodeSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
  className?: string;
  title?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 220,
  fgColor = "#633C49",
  bgColor = "#FFF8F3",
  margin = 3,
  className = "",
  title = "Scannable QR Code",
}) => {
  const { matrix, size: matrixSize } = React.useMemo(() => {
    return encodeToQrMatrix(value);
  }, [value]);

  const totalSize = matrixSize + margin * 2;

  // Build SVG path for dark modules to optimize rendering performance
  const pathD = React.useMemo(() => {
    let d = "";
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          const x = c + margin;
          const y = r + margin;
          d += `M${x},${y}h1v1h-1z `;
        }
      }
    }
    return d;
  }, [matrix, matrixSize, margin]);

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
    >
      <rect width={totalSize} height={totalSize} fill={bgColor} rx={4} />
      <path d={pathD} fill={fgColor} shapeRendering="crispEdges" />
    </svg>
  );
};
