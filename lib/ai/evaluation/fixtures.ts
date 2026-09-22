import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

/**
 * Inputs for the evaluation suite.
 *
 * The car photo is a file the repo already ships. The negative cases are
 * generated rather than committed, because a checked-in binary is a fixture
 * nobody can review in a diff — and these only need to be "obviously not a
 * car", which is a property code can produce exactly.
 */

/** A real car photograph. Already in the repo as the home hero image. */
export function carPhoto(): { bytes: Buffer; mimeType: string } {
  return { bytes: readFileSync("public/hero-car.jpg"), mimeType: "image/jpeg" };
}

function crcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC = crcTable();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));

  return Buffer.concat([length, typed, crc]);
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * A minimal truecolour PNG, written by hand so the suite needs no image
 * library. `paint` returns the RGB for a pixel, which is enough for a flat
 * colour or a simple gradient.
 */
function png(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number]
): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour RGB
  // compression, filter and interlace all take their only standard value.

  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // per-scanline filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * A flat grey rectangle. Contains no vehicle, so the model has nothing to
 * identify and should say so with low confidence rather than inventing a car.
 */
export function notACar(): { bytes: Buffer; mimeType: string } {
  return {
    bytes: png(320, 240, () => [128, 128, 128]),
    mimeType: "image/png",
  };
}

/**
 * A soft gradient. Structured enough not to read as a broken file, still
 * containing no car — the "confidently wrong" case is a model that answers
 * anyway on something that merely looks like a photograph.
 */
export function gradientNotACar(): { bytes: Buffer; mimeType: string } {
  return {
    bytes: png(320, 240, (x, y) => [
      Math.floor((x / 320) * 255),
      Math.floor((y / 240) * 255),
      160,
    ]),
    mimeType: "image/png",
  };
}
