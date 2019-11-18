import execa from "execa"

async function main() {
  await execa("jest --help")
}

main()