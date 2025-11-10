const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const {
  askServerName,
  askFramework,
  askTypeScript,
  askDatabase,
  askDjangoAppName,
} = require("./prompts");
const { generateExpress } = require("./generators/express");
const { generateDjango } = require("./generators/django");

async function createServer(serverName) {
  console.log(chalk.blue.bold("\n🚀 Welcome to Create-Server Command-Tool!\n"));

  // Get server name
  if (!serverName) {
    serverName = await askServerName();
  }

  // Get framework choice
  const framework = await askFramework();

  let useTypeScript = false;
  if (framework === "Express") {
    useTypeScript = await askTypeScript();
  }

  let djangoAppName = "";
  if (framework === "Django") {
    djangoAppName = await askDjangoAppName();
  }

  // Ask about database
  const database = await askDatabase();

  console.log(chalk.yellow("\n📦 Creating your server...\n"));

  const targetPath = path.join(process.cwd(), serverName);

  // Check if directory exists
  if (fs.existsSync(targetPath)) {
    console.log(chalk.red(`Error: Directory ${serverName} already exists!`));
    process.exit(1);
  }

  // Create project directory
  fs.mkdirSync(targetPath);

  // Generate project based on choices
  if (framework === "Express") {
    await generateExpress(targetPath, serverName, useTypeScript, database);
  } else if (framework === "Django") {
    await generateDjango(targetPath, serverName, djangoAppName, database);
  }

  console.log(chalk.green.bold("\n✅ Server created successfully!\n"));
  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.white(`- cd ${serverName}`));

  if (framework === "Express") {
    console.log(chalk.white(`- npm install`));
    console.log(chalk.white(`- npm run dev`));
  } else {
    console.log(chalk.white(`- pip install -r requirements.txt`));
    console.log(chalk.white(`- python manage.py runserver`));
  }
  console.log();
}

module.exports = { createServer };
