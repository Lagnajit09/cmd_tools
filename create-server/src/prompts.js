const inquirer = require("inquirer");

async function askTargetPath() {
  const { targetPath } = await inquirer.prompt([
    {
      type: "input",
      name: "targetPath",
      message: "Where do you want to create the server?",
      default: ".",
      validate: (input) => {
        // Allow ., .., relative paths, and absolute paths
        if (input.trim() === "") return "Path cannot be empty";
        return true;
      },
    },
  ]);
  return targetPath;
}

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
      choices: ["Express", "NestJS", "Django"],
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

async function askDatabaseType(framework) {
  const choices = ["PostgreSQL", "MySQL", "MongoDB", "None (Skip)"];

  // Django supports SQLite by default, so we can add it or just rely on None implying SQLite/default
  // But for clarity let's keep it consistent. Django generator handles "None" as SQLite.

  const { databaseType } = await inquirer.prompt([
    {
      type: "list",
      name: "databaseType",
      message: "Which database do you want to use?",
      choices,
    },
  ]);
  return databaseType === "None (Skip)" ? null : databaseType;
}

async function askOrm(framework, databaseType) {
  if (!databaseType) return null;

  let choices = [];

  if (framework === "Express") {
    if (databaseType === "MongoDB") {
      choices = ["Mongoose", "Prisma", "None (Native Driver)"];
    } else {
      choices = ["Prisma", "None (Native Driver)"];
    }
  } else if (framework === "NestJS") {
    if (databaseType === "MongoDB") {
      choices = ["Mongoose", "Prisma", "None (Native Driver)"];
    } else {
      choices = ["Prisma", "TypeORM"];
    }
  } else {
    return null; // Django uses its own ORM
  }

  const { orm } = await inquirer.prompt([
    {
      type: "list",
      name: "orm",
      message: "Which ORM do you want to use?",
      choices,
    },
  ]);

  return orm === "None (Native Driver)" ? null : orm;
}

async function askDjangoAppName() {
  const { djangoApp } = await inquirer.prompt([
    {
      type: "input",
      name: "djangoApp",
      message: "What is your first app name?",
      default: "api",
      validate: (input) => {
        if (/^[a-z0-9-_]+$/.test(input)) return true;
        return "App name may only include lowercase letters, numbers, hyphens, and underscores";
      },
    },
  ]);
  return djangoApp;
}
async function askGitInit() {
  const { initGit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "initGit",
      message: "Initialize Git repository?",
      default: false,
    },
  ]);
  return initGit;
}

async function askGitRemote(initGit) {
  if (!initGit) return null;

  const { addRemote } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addRemote",
      message: "Add remote origin URL?",
      default: false,
    },
  ]);

  if (!addRemote) return null;

  const { remoteUrl } = await inquirer.prompt([
    {
      type: "input",
      name: "remoteUrl",
      message: "Enter remote origin URL:",
      validate: (input) => {
        if (!input) return "Remote URL cannot be empty";
        if (
          !input.includes("github.com") &&
          !input.includes("gitlab.com") &&
          !input.includes("bitbucket.org") &&
          !input.startsWith("git@") &&
          !input.startsWith("https://")
        ) {
          return "Please enter a valid Git remote URL";
        }
        return true;
      },
    },
  ]);

  return remoteUrl;
}

async function askPackageManager(framework) {
  // Only ask for Node.js projects (Express and NestJS)
  if (framework !== "Express" && framework !== "NestJS") return "npm";

  // NestJS CLI officially supports npm, yarn, and pnpm
  const choices =
    framework === "NestJS"
      ? ["npm", "yarn", "pnpm"]
      : ["npm", "yarn", "pnpm", "bun"];

  const { packageManager } = await inquirer.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices,
      default: "npm",
    },
  ]);
  return packageManager;
}

async function askEnvFile() {
  const { generateEnv } = await inquirer.prompt([
    {
      type: "confirm",
      name: "generateEnv",
      message: "Generate .env file?",
      default: true,
    },
  ]);
  return generateEnv;
}

module.exports = {
  askTargetPath,
  askServerName,
  askFramework,
  askTypeScript,
  askDatabaseType,
  askOrm,
  askDjangoAppName,
  askGitInit,
  askGitRemote,
  askPackageManager,
  askEnvFile,
};
