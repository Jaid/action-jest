import path from "path"

import filterNil from "filter-nil"
import fsp from "@absolunet/fsp"
import {getInput} from "@actions/core"
import {exec} from "@actions/exec"
import {which} from "@actions/io"

async function main() {
  const logHeapUsage = getInput("logHeapUsage", {required: true})
  if (logHeapUsage) {
    console.log("Logging RAM usage in Jest tests")
  }
  const statsFile = path.resolve("dist", "jest", "stats.json")
  const jestArgs = [
    "--ci",
    "--passWithNoTests",
    "--json",
    "--outputFile",
    statsFile,
    logHeapUsage ? "--logHeapUsage" : null,
    "--runInBand",
    "--collectCoverageFrom",
    "src/**",
    "--coverageReporters",
    "json",
    "--coverageDirectory",
    path.resolve("dist", "jest", "coverage"),
  ] |> filterNil
  const jestDependencyFile = path.resolve("node_modules", "jest", "bin", "jest.js")
  const isJestInstalled = await fsp.pathExists(jestDependencyFile)
  if (isJestInstalled) {
    const nodeArgs = [
      logHeapUsage ? "--expose-gc" : null,
      jestDependencyFile,
      ...jestArgs,
    ] |> filterNil
    await exec("node", nodeArgs)
  } else {
    const npxPath = await which("npx", true)
    console.warn("Jest not found in %s, using %s instead to install and run it", jestDependencyFile, npxPath)
    await exec(npxPath, ["jest", ...jestArgs])
  }
  const stats = await fsp.readJson(statsFile)
  console.warn(stats)
}

main()