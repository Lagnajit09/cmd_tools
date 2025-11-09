const inquirer = require("inquirer");

async function askServerName() {
  const { serverName } = await inquirer.prompt([
    {
      type: "input",
      name: "serverName",
      message: "What is your server name?",
      default: "my-server",
      validate: (input) => {
        if (/^[a-z0-9-_]+$/.test(input)) return true;
        return "Server name may only include lowercase letters, numbers, hyphens, and underscores";
      },
    },
  ]);
  return serverName;
}

async function askFramework() {
  const { framework } = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Which framework do you want to use?",
      choices: ["Express"],
    },
  ]);
  return framework;
}

async function askTypeScript() {
  const { useTypeScript } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useTypeScript",
      message: "Do you want to use TypeScript?",
      default: false,
    },
  ]);
  return useTypeScript;
}

async function askDatabase() {
  const { database } = await inquirer.prompt([
    {
      type: "list",
      name: "database",
      message: "Which database/ORM do you want to use?",
      choices: ["None (Skip)", "Prisma", "MongoDB", "PostgreSQL", "MySQL"],
    },
  ]);
  return database === "None (Skip)" ? null : database;
}

module.exports = {
  askServerName,
  askFramework,
  askTypeScript,
  askDatabase,
};
