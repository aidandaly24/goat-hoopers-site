#!/usr/bin/env python3
"""Inspect animation clips inside a GLB: per-clip (node, path, value range).

Usage: python3 check_glb_anims.py file.glb
"""
import json
import struct
import sys


def read_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, ver, length = struct.unpack_from('<III', data, 0)
    assert magic == 0x46546C67, 'not a GLB'
    off = 12
    json_bytes, bin_bytes = None, b''
    while off < len(data):
        clen, ctype = struct.unpack_from('<II', data, off)
        chunk = data[off + 8: off + 8 + clen]
        if ctype == 0x4E4F534A:
            json_bytes = chunk
        elif ctype == 0x004E4942:
            bin_bytes = chunk
        off += 8 + clen
    return json.loads(json_bytes.decode('utf-8')), bin_bytes


def accessor_data(js, bin_bytes, acc_idx):
    acc = js['accessors'][acc_idx]
    bv = js['bufferViews'][acc['bufferView']]
    comp = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}[acc['componentType']]
    ncomp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[acc['type']]
    start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    fmt = '<' + comp * (count * ncomp)
    vals = struct.unpack_from(fmt, bin_bytes, start)
    return [vals[i * ncomp:(i + 1) * ncomp] for i in range(count)]


def main(path):
    js, bin_bytes = read_glb(path)
    names = {i: n.get('name', f'node{i}') for i, n in enumerate(js.get('nodes', []))}
    print(f'{path}: {len(js.get("animations", []))} animations')
    for anim in js.get('animations', []):
        print(f"  clip '{anim.get('name')}':")
        for ch in anim['channels']:
            node = names[ch['target']['node']]
            path_ = ch['target']['path']
            samp = anim['samplers'][ch['sampler']]
            out = accessor_data(js, bin_bytes, samp['output'])
            ncomp = len(out[0])
            mins = [min(v[c] for v in out) for c in range(ncomp)]
            maxs = [max(v[c] for v in out) for c in range(ncomp)]
            mins = ', '.join(f'{v:.3f}' for v in mins)
            maxs = ', '.join(f'{v:.3f}' for v in maxs)
            print(f"    {node:14s} {path_:10s} min=({mins}) max=({maxs}) n={len(out)}")


if __name__ == '__main__':
    main(sys.argv[1])
