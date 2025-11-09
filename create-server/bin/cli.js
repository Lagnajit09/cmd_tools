#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");
const { createServer } = require("../src/index");

program
  .version("1.0.0")
  .argument("[server-name]", "Name of the server project")
  .description("Create a new server project")
  .action(async (serverName) => {
    try {
      await createServer(serverName);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
