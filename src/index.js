import path from "path"

import fsp from "@absolunet/fsp"
import {exec} from "@actions/exec"
import {which} from "@actions/io"

async function main() {
  const jestArgs = [
    "--passWithNoTests",
    "--coverage",
    "--outputFile",
    path.resolve("dist", "jest", "stats.json"),
  ]
  const jestDependencyFile = path.resolve("node_modules", "jest", "bin", "jest.js")
  const isJestInstalled = await fsp.pathExists(jestDependencyFile)
  if (isJestInstalled) {
    await exec("node", [jestDependencyFile, "--", ...jestArgs])
  } else {
    const npxPath = await which("npx", true)
    console.warn("Jest not found in %s, using %s instead to install and run it", jestDependencyFile, npxPath)
    await exec(npxPath, ["jest", ...jestArgs])
  }
}

main()