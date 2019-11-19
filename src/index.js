import exec from "@actions/exec"

async function main() {
  await exec.exec("npx", "jest", "--help")
}

main()