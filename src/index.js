import {exec} from "@actions/exec"
import {which} from "@actions/io"
import {debug} from "@actions/core"

async function main() {
  const npxPath = await which("npx", true)
  debug(`Npx path: ${npxPath}`)
  await exec.exec(npxPath, "jest", "--help")
}

main()