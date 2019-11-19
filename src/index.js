import {exec} from "@actions/exec"
import {which} from "@actions/io"

async function main() {
  const npxPath = await which("npx", true)
  await exec.exec(npxPath, "jest", "--help")
}

main()