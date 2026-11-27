"""Package the demo's binary XYZ/RGB PLY files as a browser-loadable script."""

import base64
import json
from pathlib import Path
import re


SITE = Path(__file__).resolve().parents[1]
VERTEX_LAYOUT = [
    "property float x",
    "property float y",
    "property float z",
    "property uchar red",
    "property uchar green",
    "property uchar blue",
]


def pack_object(path):
    with path.open("rb") as source:
        header = []
        for raw_line in source:
            line = raw_line.decode("ascii").strip()
            if line == "end_header":
                break
            if not line.startswith(("comment ", "obj_info ")):
                header.append(line)
        else:
            raise ValueError(f"{path.name} has an incomplete PLY header")

        if (
            len(header) != 9
            or header[:2] != ["ply", "format binary_little_endian 1.0"]
            or not header[2].startswith("element vertex ")
            or header[3:] != VERTEX_LAYOUT
        ):
            raise ValueError(f"{path.name} must be a binary little-endian XYZ/RGB point cloud")

        count = int(header[2].split()[-1])
        payload = source.read()
        if count <= 0 or len(payload) != count * 15:
            raise ValueError(f"{path.name} has an invalid vertex count")

    return {
        "id": path.stem,
        "points": base64.b64encode(payload).decode("ascii"),
    }


def main():
    sources = sorted(
        SITE.joinpath("rgb_point").glob("*.ply"),
        key=lambda path: [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", path.stem)],
    )
    if not sources:
        raise ValueError("No PLY files in rgb_point/")

    objects = [pack_object(path) for path in sources]
    output = SITE / "assets" / "demo-points.js"
    output.write_text(
        "// Generated from rgb_point/*.ply by tools/build-point-cloud.py.\n"
        "const demoPointData = [\n"
        + ",\n".join("  " + json.dumps(item) for item in objects)
        + "\n];\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
