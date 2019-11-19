import path from "path"

import filterNil from "filter-nil"
import fsp from "@absolunet/fsp"
import {getInput} from "@actions/core"
import {exec} from "@actions/exec"
import {which, mkdirP} from "@actions/io"

async function main() {
  const jestReportDirectory = getInput("jestReportDirectory", {required: true})
  await mkdirP(jestReportDirectory)
  const logHeapUsage = getInput("logHeapUsage", {required: true})
  if (logHeapUsage) {
    console.log("Logging RAM usage in Jest tests")
  }
  const statsFile = path.join(jestReportDirectory, "stats.json")
  const jestArgs = [
    "--ci",
    "--color=true",
    "--passWithNoTests",
    "--json",
    "--outputFile",
    statsFile,
    logHeapUsage ? "--logHeapUsage" : null,
    "--runInBand",
    "--coverage",
    "--coverageReporters",
    "text",
    "--coverageReporters",
    "json-summary",
    "--collectCoverageFrom",
    "src/**",
    "--coverageDirectory",
    path.join(jestReportDirectory, "coverage"),
    "--coverageThreshold",
    JSON.stringify({
      global: {
        lines: getInput("requiredLinesCoverage", {required: true}),
        functions: getInput("requiredFunctionsCoverage", {required: true}),
        branches: getInput("requiredBranchesCoverage", {required: true}),
        statements: getInput("requiredStatementsCoverage", {required: true}),
      },
    }),
  ] |> filterNil
  const jestDependencyFile = path.join("node_modules", "jest", "bin", "jest.js")
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