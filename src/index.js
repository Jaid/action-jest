import execa from "execa"

async function main() {
  await execa("npx jest --help")
}

main()