import {exec} from "@actions/exec"
import {which} from "@actions/io"

async function main() {
  const npxPath = await which("npx", true)
  console.log(`Npx path: ${npxPath}`)
  console.log(`cwd: ${require("fs").readdirSync("").join(" ")}`)
  await exec(npxPath, ["jest", "--help"])
}

main()