import { Texture } from '../scene/Texture';

const toChar = String.fromCharCode;

const MINELEN = 8;
const MAXELEN = 0x7fff;

function setToPixels(rgbe, buffer, offset) {
  buffer[offset] = rgbe[0];
  buffer[offset + 1] = rgbe[1];
  buffer[offset + 2] = rgbe[2];
  buffer[offset + 3] = rgbe[3];
  return buffer;
}

function uint82string(array, offset, size) {
    let str = '';
    for (let i = offset; i < size; i++) {
        str += toChar(array[i]);
    }
    return str;
}

function copyrgbe(s, t) {
  t[0] = s[0];
  t[1] = s[1];
  t[2] = s[2];
  t[3] = s[3];
}

// TODO : check
function oldReadColors(scan, buffer, offset, xmax) {
  let rshift = 0, x = 0, len = xmax;
  while (len > 0) {
    scan[x][0] = buffer[offset++];
    scan[x][1] = buffer[offset++];
    scan[x][2] = buffer[offset++];
    scan[x][3] = buffer[offset++];
    if (scan[x][0] === 1 && scan[x][1] === 1 && scan[x][2] === 1) {
      // exp is count of repeated pixels
      for (let i = (scan[x][3] << rshift) >>> 0; i > 0; i--) {
        copyrgbe(scan[x-1], scan[x]);
        x++;
        len--;
      }
      rshift += 8;
    } else {
      x++;
      len--;
      rshift = 0;
    }
  }
  return offset;
}

function readColors(scan, buffer, offset, xmax) {
    if ((xmax < MINELEN) | (xmax > MAXELEN)) {
      return oldReadColors(scan, buffer, offset, xmax);
    }
    let i = buffer[offset++];
    if (i != 2) {
      return oldReadColors(scan, buffer, offset - 1, xmax);
    }
    scan[0][1] = buffer[offset++];
    scan[0][2] = buffer[offset++];

    i = buffer[offset++];
    if ((((scan[0][2] << 8) >>> 0) | i) >>> 0 !== xmax) {
      return null;
    }
    for (let i = 0; i < 4; i++) {
      for (let x = 0; x < xmax;) {
        let code = buffer[offset++];
        if (code > 128) {
          code = (code & 127) >>> 0;
          let val = buffer[offset++];
          while (code--) {
            scan[x++][i] = val;
          }
        } else {
          while (code--) {
            scan[x++][i] = buffer[offset++];
          }
        }
      }
    }
    return offset;
}

export function parseRGBE(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const size = data.length;
  if (uint82string(data, 0, 2) !== '#?') {
    return;
  }
  let i;
  // find empty line, next line is resolution info
  for (i = 2; i < size; i++) {
    if (toChar(data[i]) === '\n' && toChar(data[i+1]) === '\n') {
      break;
    }
  }
  if (i >= size) { // not found
    return;
  }
  // find resolution info line
  i += 2;
  let str = '';
  for (; i < size; i++) {
    let _char = toChar(data[i]);
    if (_char === '\n') {
      break;
    }
    str += _char;
  }
  // -Y M +X N
  let tmp = str.split(' ');
  let height = parseInt(tmp[1]);
  let width = parseInt(tmp[3]);
  if (!width || !height) {
      return;
  }

  // read and decode actual data
  let offset = i + 1;
  let scanline = [];
  // memzero
  for (let x = 0; x < width; x++) {
    scanline[x] = [];
    for (let j = 0; j < 4; j++) {
      scanline[x][j] = 0;
    }
  }
  let pixels = new Float32Array(width * height * 4);
  let offset2 = 0;
  for (let y = 0; y < height; y++) {
    offset = readColors(scanline, data, offset, width);
    if (!offset) {
      return null;
    }
    for (let x = 0; x < width; x++) {
      setToPixels(scanline[x], pixels, offset2);
      offset2 += 4;
    }
  }

  return new Texture({
    width,
    height,
    data: pixels
  });
}

export function loadRGBE(url) {
  return fetch(url).then(res => res.arrayBuffer()).then(ab => {
    return parseRGBE(ab);
  });
}