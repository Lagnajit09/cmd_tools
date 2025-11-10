#!/usr/bin/env node

const { program } = require("commander");
const chalk = require("chalk");
const { createServer } = require("../src/index");

program
  .version("1.0.0")
  .argument("[server-name]", "Name of the server project")
  .argument(
    "[target-path]",
    "Path where to create the server (default: current directory)"
  )
  .description("Create a new server project")
  .action(async (serverName, targetPath) => {
    try {
      await createServer(serverName, targetPath);
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error.message);
      if (error.stack && process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText(
  "after",
  `

Examples:
  $ create-server my-api                    # Create in current directory
  $ create-server my-api .                  # Create in current directory (explicit)
  $ create-server my-api ./projects         # Create in ./projects/my-api
  $ create-server my-api ../backend         # Create in ../backend/my-api
  $ create-server my-api /path/to/projects  # Create in absolute path
  
  # You can also run without arguments and it will prompt you:
  $ create-server
`
);

program.parse(process.argv);
