import path from "node:path"

import fsp from "@absolunet/fsp"
import {getInput, setFailed} from "@actions/core"
import {exec} from "@actions/exec"
import {mkdirP, which} from "@actions/io"
import filterNil from "./lib/esm/filter-nil.js"
import {globby} from "globby"

import getBooleanInput from "./lib/esm/get-boolean-action-input.js"
import hasContent, {isEmpty} from "./lib/esm/has-content.js"
import zahl from "./lib/esm/zahl.js"

async function main() {
  const githubToken = getInput("githubToken")
  const prepareActionJest = getBooleanInput("prepareActionJest", {required: true})
  if (prepareActionJest) {
    const execOptions = {}
    if (githubToken) {
      execOptions.env = {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      }
    }
    await exec("npm", ["run", "prepareActionJest", "--if-present"], execOptions)
  }
  const npmPrepareScript = getInput("npmPrepareScript")
  if (npmPrepareScript) {
    /**
     * @type {import("@actions/exec").ExecOptions}
     */
    const execOptions = {}
    if (githubToken) {
      execOptions.env = {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      }
    }
    await exec("npm", ["run", npmPrepareScript], execOptions)
  }
  const possibleEntryFiles = await globby("dist/package/production/*.js")
  if (isEmpty(possibleEntryFiles)) {
    console.log(`No entry point files found in ${path.resolve("dist/package/production")}`)
    return
  }
  const pickedEntry = possibleEntryFiles[0]
  const jestReportDirectory = getInput("jestReportDirectory")
  await mkdirP(jestReportDirectory)
  const logHeapUsage = getInput("logHeapUsage")
  if (logHeapUsage) {
    console.log("Logging RAM usage in Jest tests")
  }
  const failOnOpenHandles = getInput("failOnOpenHandles")
  if (logHeapUsage) {
    console.log("Open handles detection is turned on")
  }
  const statsFile = path.join(jestReportDirectory, "stats.json")
  const jestArgs = filterNil([
    "--ci",
    "--color",
    true,
    "--passWithNoTests",
    "--json",
    "--outputFile",
    statsFile,
    logHeapUsage ? "--logHeapUsage" : null,
    "--runInBand",
    "--testFailureExitCode",
    0,
    "--coverage",
    "--coverageReporters",
    "text-summary",
    "--coverageReporters",
    "json-summary",
    "--collectCoverageFrom",
    "src/**",
    "--coverageDirectory",
    path.join(jestReportDirectory, "coverage"),
    "--coverageThreshold",
    JSON.stringify({
      global: {
        lines: Number(getInput("requiredLinesCoverage")),
        functions: Number(getInput("requiredFunctionsCoverage")),
        branches: Number(getInput("requiredBranchesCoverage")),
        statements: Number(getInput("requiredStatementsCoverage")),
      },
    }),
    failOnOpenHandles ? "--detectOpenHandles" : null,
  ])
  const jestDependencyFile = path.join("node_modules", "jest", "bin", "jest.js")
  const isJestInstalled = await fsp.pathExists(jestDependencyFile)
  let exitCode
  const execArgs = {
    env: {
      ...process.env,
      NODE_ENV: "production",
      MAIN: pickedEntry,
    },
  }
  if (isJestInstalled) {
    const nodeArgs = filterNil([
      logHeapUsage ? "--expose-gc" : null,
      jestDependencyFile,
      ...jestArgs,
    ])
    exitCode = await exec("node", nodeArgs, execArgs)
  } else {
    const npxPath = await which("npx", true)
    console.warn("Jest not found in %s, using %s instead to install and run it", jestDependencyFile, npxPath)
    exitCode = await exec(npxPath, ["jest", ...jestArgs], execArgs)
  }
  if (exitCode !== 0) {
    setFailed(`Jest CLI returned exit code ${exitCode}`)
    return
  }
  const stats = await fsp.readJson(statsFile)
  if (stats.numFailedTests) {
    setFailed(`${zahl(stats.numFailedTests, "test")} did fail`)
    return
  }
  if (failOnOpenHandles && hasContent(stats.openHandles)) {
    setFailed(`Jest detected ${zahl(stats.openHandles.length, "open handle")}`)
    return
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-jest threw an Error")
})