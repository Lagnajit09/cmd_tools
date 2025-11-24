const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const {
  askServerName,
  askFramework,
  askTypeScript,
  askDatabaseType,
  askOrm,
  askGitInit,
  askGitRemote,
  askPackageManager,
  askEnvFile,
  askTargetPath,
  askDjangoAppName,
} = require("./prompts");
const { generateExpress } = require("./generators/express");
const { generateDjango } = require("./generators/django");
const { generateNestJS } = require("./generators/nestjs");

async function createServer(serverName, targetPathArg) {
  console.log(chalk.blue.bold("\n🚀 Welcome to Create Server!\n"));

  // Get server name
  if (!serverName) {
    serverName = await askServerName();
  }

  // Get target path if not provided
  let basePath;
  if (!targetPathArg) {
    basePath = await askTargetPath();
  } else {
    basePath = targetPathArg;
  }

  // Resolve the full target path
  const resolvedBasePath = path.resolve(process.cwd(), basePath);
  const targetPath = path.join(resolvedBasePath, serverName);

  // Check if directory exists
  if (fs.existsSync(targetPath)) {
    console.log(
      chalk.red(
        `\n❌ Error: Directory ${serverName} already exists at ${resolvedBasePath}!`
      )
    );
    process.exit(1);
  }

  // Check if parent directory exists, if not create it
  if (!fs.existsSync(resolvedBasePath)) {
    console.log(chalk.yellow(`\n📁 Creating directory: ${resolvedBasePath}`));
    fs.mkdirpSync(resolvedBasePath);
  }

  // Check if Git is already initialized in the target path or any parent directory
  const gitExists = checkGitRepository(resolvedBasePath);

  // Get framework choice
  const framework = await askFramework();

  console.log("Selected Framework: " + framework);

  let useTypeScript = false;
  let djangoAppName = "";
  let database = null;
  let orm = null;
  let packageManager = "";

  if (framework === "Express") {
    useTypeScript = await askTypeScript();

    const databaseType = await askDatabaseType(framework);
    if (databaseType) {
      database = databaseType;
      orm = await askOrm(framework, databaseType);
    }

    packageManager = await askPackageManager(framework);
  } else if (framework === "NestJS") {
    // NestJS always uses TypeScript
    useTypeScript = true;

    const databaseType = await askDatabaseType(framework);
    if (databaseType) {
      database = databaseType;
      orm = await askOrm(framework, databaseType);
    }

    packageManager = await askPackageManager(framework);
  } else if (framework === "Django") {
    djangoAppName = await askDjangoAppName();

    const databaseType = await askDatabaseType(framework);
    if (databaseType) {
      database = databaseType;
      // Django uses its own ORM, so we don't ask for ORM
    }
  }

  // Ask about environment file
  const generateEnv = await askEnvFile();

  // Ask about Git initialization only if Git doesn't exist
  let initGit = false;
  let remoteUrl = null;

  if (gitExists) {
    console.log(
      chalk.cyan(`\n📚 Git repository detected in ${resolvedBasePath}`)
    );
    console.log(chalk.cyan("   Skipping Git initialization...\n"));
  } else {
    initGit = await askGitInit();
    remoteUrl = await askGitRemote(initGit);
  }

  console.log(chalk.yellow("\n📦 Creating your server...\n"));

  // Create project directory
  fs.mkdirSync(targetPath);

  // Generate project based on choices
  const config = {
    serverName,
    useTypeScript,
    database,
    orm,
    djangoAppName,
    packageManager,
    generateEnv,
    gitExists,
    initGit,
    remoteUrl,
  };

  if (framework === "Express") {
    await generateExpress(targetPath, config);
  } else if (framework === "NestJS") {
    await generateNestJS(targetPath, config);
  } else if (framework === "Django") {
    await generateDjango(targetPath, config);
  }

  // Initialize Git if requested and doesn't exist
  if (initGit && !gitExists) {
    console.log(chalk.yellow("\n📚 Initializing Git repository..."));
    try {
      execSync("git init", { cwd: targetPath, stdio: "inherit" });

      if (remoteUrl) {
        execSync(`git remote add origin ${remoteUrl}`, {
          cwd: targetPath,
          stdio: "inherit",
        });
        console.log(chalk.green(`✅ Remote origin added: ${remoteUrl}`));
      }

      console.log(chalk.green("✅ Git repository initialized"));
    } catch (error) {
      console.log(chalk.red("❌ Failed to initialize Git repository"));
    }
  }

  console.log(chalk.green.bold("\n✅ Server created successfully!\n"));

  // Show the path where project was created if not in current directory
  const relativePath = path.relative(process.cwd(), targetPath);
  if (relativePath !== serverName) {
    console.log(
      chalk.cyan(`📁 Project created at: ${chalk.white(relativePath)}\n`)
    );
  }

  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.white(`  cd ${relativePath || serverName}`));

  if (framework === "Express" || framework === "NestJS") {
    const installCmd = getInstallCommand(packageManager);
    const devCmd = getDevCommand(packageManager, framework);

    console.log(chalk.white(`  ${installCmd}`));
    console.log(chalk.white(`  ${devCmd}`));
  } else {
    console.log(
      chalk.white(
        `  source venv/bin/activate  # On Windows: venv\\Scripts\\activate`
      )
    );
    console.log(chalk.white(`  python manage.py runserver`));
  }

  if (initGit && !gitExists && !remoteUrl) {
    console.log(chalk.white(`\n  git remote add origin <your-repo-url>`));
    console.log(chalk.white(`  git add .`));
    console.log(chalk.white(`  git commit -m "Initial commit"`));
    console.log(chalk.white(`  git push -u origin main`));
  } else if (initGit && !gitExists && remoteUrl) {
    console.log(chalk.white(`\n  git add .`));
    console.log(chalk.white(`  git commit -m "Initial commit"`));
    console.log(chalk.white(`  git push -u origin main`));
  }

  console.log();
}

function checkGitRepository(dirPath) {
  try {
    // Check current directory and all parent directories
    let currentPath = path.resolve(dirPath);
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      const gitPath = path.join(currentPath, ".git");
      if (fs.existsSync(gitPath)) {
        return true;
      }
      currentPath = path.dirname(currentPath);
    }

    return false;
  } catch (error) {
    return false;
  }
}

function getInstallCommand(packageManager) {
  const commands = {
    npm: "npm install",
    yarn: "yarn install",
    pnpm: "pnpm install",
    bun: "bun install",
  };
  return commands[packageManager] || "npm install";
}

function getDevCommand(packageManager, framework) {
  if (framework === "NestJS") {
    const commands = {
      npm: "npm run start:dev",
      yarn: "yarn start:dev",
      pnpm: "pnpm start:dev",
      bun: "bun start:dev",
    };
    return commands[packageManager] || "npm run start:dev";
  } else {
    const commands = {
      npm: "npm run dev",
      yarn: "yarn dev",
      pnpm: "pnpm dev",
      bun: "bun dev",
    };
    return commands[packageManager] || "npm run dev";
  }
}

module.exports = { createServer };
