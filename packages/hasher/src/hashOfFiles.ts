import crypto from "crypto";
import path from "path";
import fs from "fs-extra";
import { getListOfGitFiles } from "./gitFiles";

import { hashStrings } from "./helpers";

const newline = /\r\n|\r|\n/g;
const LF = "\n";

const toUnixPath = (path: string) => path.replace(/\\/g, "/");

// We have to force the types because globby types are wrong
export async function generateHashOfFiles(
  packageRoot: string
): Promise<string> {
  const files = await getListOfGitFiles(packageRoot);

  const hashes = await Promise.all(
    files.map(async file => {
      const hasher = crypto.createHash("sha1");

      // We use unix hash for the files path to have stable
      // hash across platforms.
      hasher.update(toUnixPath(file));

      const stat = await fs.stat(path.join(packageRoot, file));
      if (stat.isFile()) {
        const fileBuffer = await fs.readFile(path.join(packageRoot, file));
        const data = fileBuffer.toString().replace(newline, LF);
        hasher.update(data);
      }

      return hasher.digest("hex");
    })
  );

  return hashStrings(hashes);
}
