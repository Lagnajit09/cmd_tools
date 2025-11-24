const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");

async function generateNestJS(targetPath, config) {
  const {
    serverName,
    useTypeScript = true, // NestJS is TypeScript by default
    database,
    orm,
    packageManager,
    generateEnv,
    gitExists,
    initGit,
  } = config;

  console.log(
    "DEBUG: NestJS Generator Config:",
    JSON.stringify(config, null, 2)
  );
  console.log("DEBUG: ORM:", orm);
  console.log("DEBUG: Database:", database);

  console.log(chalk.yellow("📦 Installing NestJS CLI globally..."));

  // Install NestJS CLI if not already installed
  try {
    execSync("nest --version", { stdio: "ignore" });
  } catch (error) {
    console.log(chalk.yellow("Installing @nestjs/cli..."));
    const installCmd =
      packageManager === "npm"
        ? "npm install -g @nestjs/cli"
        : packageManager === "yarn"
        ? "yarn global add @nestjs/cli"
        : packageManager === "pnpm"
        ? "pnpm add -g @nestjs/cli"
        : "bun add -g @nestjs/cli";
    execSync(installCmd, { stdio: "inherit" });
  }

  // Create .gitignore first if Git is being used
  if (initGit || gitExists) {
    console.log(chalk.yellow("📝 Creating .gitignore..."));
    const gitignoreContent = `# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`;
    fs.writeFileSync(path.join(targetPath, ".gitignore"), gitignoreContent);
  }

  console.log(chalk.yellow("🏗️  Creating NestJS project structure..."));

  // Create NestJS project using CLI
  const pmFlag =
    packageManager === "npm"
      ? "--package-manager npm"
      : packageManager === "yarn"
      ? "--package-manager yarn"
      : packageManager === "pnpm"
      ? "--package-manager pnpm"
      : "--package-manager npm";

  try {
    // Create a temporary directory name since we're already in targetPath
    const tempName = "temp-nest-app";
    const parentPath = path.dirname(targetPath);

    // Generate NestJS app in parent directory (skip install to avoid node_modules issues)
    execSync(`nest new ${tempName} ${pmFlag} --skip-git --skip-install`, {
      cwd: parentPath,
      stdio: "inherit",
    });

    // Move contents from temp directory to targetPath (excluding node_modules)
    const tempPath = path.join(parentPath, tempName);
    const files = fs.readdirSync(tempPath);

    files.forEach((file) => {
      // Skip node_modules if it exists
      if (file === "node_modules") return;

      const srcPath = path.join(tempPath, file);
      const destPath = path.join(targetPath, file);

      // Don't overwrite .gitignore if we already created it
      if (file === ".gitignore" && (initGit || gitExists)) {
        return;
      }

      fs.moveSync(srcPath, destPath, { overwrite: true });
    });

    // Remove temp directory
    fs.removeSync(tempPath);

    // Now install dependencies in the target path
    console.log(chalk.yellow("\n📦 Installing dependencies..."));
    const installCmd =
      packageManager === "npm"
        ? "npm install"
        : packageManager === "yarn"
        ? "yarn install"
        : "pnpm install";

    execSync(installCmd, {
      cwd: targetPath,
      stdio: "inherit",
    });
  } catch (error) {
    console.log(chalk.red("❌ Failed to create NestJS project"));
    throw error;
  }

  // Update package.json with project name
  const packageJsonPath = path.join(targetPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);
  packageJson.name = serverName;

  // Add essential NestJS packages
  packageJson.dependencies["@nestjs/config"] = "^4.0.2";
  packageJson.dependencies["class-validator"] = "^0.14.2";
  packageJson.dependencies["class-transformer"] = "^0.5.1";

  // Add database dependencies
  // Add database dependencies
  if (orm === "Prisma") {
    packageJson.dependencies["@prisma/client"] = "latest";
    packageJson.devDependencies["prisma"] = "latest";

    if (database === "PostgreSQL") {
      packageJson.dependencies["@prisma/adapter-pg"] = "latest";
      packageJson.dependencies["pg"] = "latest";
      packageJson.dependencies["@types/pg"] = "latest";
    } else if (database === "MySQL") {
      packageJson.dependencies["mysql2"] = "latest";
    }

    packageJson.scripts["prisma:generate"] = "prisma generate";
    packageJson.scripts["prisma:migrate"] = "prisma migrate dev";
    packageJson.scripts["prisma:studio"] = "prisma studio";
  } else if (orm === "TypeORM") {
    packageJson.dependencies["@nestjs/typeorm"] = "latest";
    packageJson.dependencies["typeorm"] = "latest";
    if (database === "PostgreSQL") {
      packageJson.dependencies["pg"] = "latest";
    } else if (database === "MySQL") {
      packageJson.dependencies["mysql2"] = "latest";
    }
  } else if (database === "MongoDB") {
    if (orm === "Mongoose") {
      packageJson.dependencies["@nestjs/mongoose"] = "latest";
      packageJson.dependencies["mongoose"] = "latest";
    } else if (orm === "Prisma") {
      packageJson.dependencies["@prisma/client"] = "latest";
      packageJson.devDependencies["prisma"] = "latest";
      packageJson.scripts["prisma:generate"] = "prisma generate";
    } else {
      packageJson.dependencies["mongodb"] = "latest";
    }
  }

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

  // Update main.ts with custom configuration
  const mainTsPath = path.join(targetPath, "src", "main.ts");
  const mainTsContent = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(\`🚀 Server is running on http://localhost:\${port}\`);
}
bootstrap();
`;
  fs.writeFileSync(mainTsPath, mainTsContent);

  // Update app.controller.ts
  const appControllerPath = path.join(targetPath, "src", "app.controller.ts");
  const appControllerContent = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
`;
  fs.writeFileSync(appControllerPath, appControllerContent);

  // Update app.service.ts
  const appServicePath = path.join(targetPath, "src", "app.service.ts");
  const appServiceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from ${serverName}!';
  }
}
`;
  fs.writeFileSync(appServicePath, appServiceContent);

  // Create .env file if requested
  if (generateEnv) {
    let envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

    if (orm === "Prisma") {
      envContent += `
# Database Configuration (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
`;
    } else if (orm === "Mongoose") {
      envContent += `
# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/${serverName}
DB_NAME=${serverName}
`;
    } else if (database === "PostgreSQL") {
      envContent += `
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${serverName}
DB_USER=postgres
DB_PASSWORD=yourpassword
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/${serverName}
`;
    } else if (database === "MySQL") {
      envContent += `
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${serverName}
DB_USER=root
DB_PASSWORD=yourpassword
DATABASE_URL=mysql://root:yourpassword@localhost:3306/${serverName}
`;
    }

    envContent += `
# JWT Configuration (if needed)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
`;

    fs.writeFileSync(path.join(targetPath, ".env"), envContent);
    fs.writeFileSync(
      path.join(targetPath, ".env.example"),
      envContent.replace(/=.+/g, "=")
    );
  }

  // Update .gitignore if Git is initialized and it wasn't created earlier
  if (
    (initGit || gitExists) &&
    !fs.existsSync(path.join(targetPath, ".gitignore"))
  ) {
    const gitignorePath = path.join(targetPath, ".gitignore");
    const additionalEntries = `
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`;
    fs.writeFileSync(gitignorePath, additionalEntries);
  } else if (initGit || gitExists) {
    // If .gitignore exists (from NestJS or our earlier creation), ensure .env entries are present
    const gitignorePath = path.join(targetPath, ".gitignore");
    let gitignoreContent = fs.readFileSync(gitignorePath, "utf8");

    if (!gitignoreContent.includes(".env")) {
      const additionalEntries = `
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`;
      fs.appendFileSync(gitignorePath, additionalEntries);
    }
  }

  // Create Prisma schema and config if needed
  if (orm === "Prisma") {
    const prismaPath = path.join(targetPath, "prisma");
    fs.mkdirSync(prismaPath, { recursive: true });

    // Create prisma.config.ts
    const prismaConfigContent = `import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: {
    kind: 'multi',
    folder: 'prisma/schema',
  },
  datasource: {
    provider: '${
      database === "PostgreSQL"
        ? "postgresql"
        : database === "MySQL"
        ? "mysql"
        : "mongodb"
    }',
    url: process.env.DATABASE_URL,
  },
});
`;
    fs.writeFileSync(
      path.join(targetPath, "prisma.config.ts"),
      prismaConfigContent
    );

    const schemaFolderPath = path.join(prismaPath, "schema");
    fs.mkdirSync(schemaFolderPath, { recursive: true });

    const schema = `generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    fs.writeFileSync(path.join(schemaFolderPath, "schema.prisma"), schema);

    // Create Prisma module and service
    const prismaServicePath = path.join(targetPath, "src", "prisma");
    fs.mkdirSync(prismaServicePath, { recursive: true });

    let prismaServiceContent = "";
    if (database === "PostgreSQL") {
      prismaServiceContent = `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
    } else {
      prismaServiceContent = `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
    }

    fs.writeFileSync(
      path.join(prismaServicePath, "prisma.service.ts"),
      prismaServiceContent
    );

    const prismaModuleContent = `import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;
    fs.writeFileSync(
      path.join(prismaServicePath, "prisma.module.ts"),
      prismaModuleContent
    );

    // Update app.module.ts to include PrismaModule
    const appModulePath = path.join(targetPath, "src", "app.module.ts");
    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(appModulePath, appModuleContent);
  } else if (orm === "Mongoose") {
    // Update app.module.ts for MongoDB
    const appModulePath = path.join(targetPath, "src", "app.module.ts");
    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/${serverName}'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(appModulePath, appModuleContent);
  } else if (orm === "TypeORM") {
    // Update app.module.ts for TypeORM
    const dbType = database === "PostgreSQL" ? "postgres" : "mysql";
    const appModulePath = path.join(targetPath, "src", "app.module.ts");
    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: '${dbType}',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '${
        database === "PostgreSQL" ? "5432" : "3306"
      }'),
      username: process.env.DB_USER || '${
        database === "PostgreSQL" ? "postgres" : "root"
      }',
      password: process.env.DB_PASSWORD || 'yourpassword',
      database: process.env.DB_NAME || '${serverName}',
      entities: [],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(appModulePath, appModuleContent);
  } else if (database === "MongoDB" && !orm) {
    // Native MongoDB Setup
    const databasePath = path.join(targetPath, "src", "database");
    fs.mkdirSync(databasePath, { recursive: true });

    const databaseModuleContent = `import { Module, Global } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (): Promise<Db> => {
        try {
          const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
          const dbName = process.env.DB_NAME || '${serverName}';
          return client.db(dbName);
        } catch (e) {
          throw e;
        }
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}
`;
    fs.writeFileSync(
      path.join(databasePath, "database.module.ts"),
      databaseModuleContent
    );

    const appModulePath = path.join(targetPath, "src", "app.module.ts");
    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(appModulePath, appModuleContent);
  } else {
    // No database - just add ConfigModule
    const appModulePath = path.join(targetPath, "src", "app.module.ts");
    const appModuleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(appModulePath, appModuleContent);
  }

  // Update README
  const installCmd = getInstallCommand(packageManager);
  const devCmd = getDevCommand(packageManager);

  const readme = `# ${serverName}

NestJS TypeScript Server

## Features

- ✅ NestJS framework
- ✅ TypeScript configured
- ✅ CORS enabled
- ✅ Environment variables support
- ✅ Global validation pipes
${database ? `- ✅ ${database} integration` : ""}
- ✅ Health check endpoint

## Getting Started

### Installation

\`\`\`bash
${installCmd}
\`\`\`

### Environment Variables

${
  generateEnv
    ? "Copy `.env.example` to `.env` and update the values:"
    : "Create a `.env` file in the root directory:"
}

\`\`\`env
PORT=3000
NODE_ENV=development
API_PREFIX=api
${database ? "DATABASE_URL=your_database_url" : ""}
\`\`\`

${
  database === "Prisma"
    ? `### Prisma Setup

\`\`\`bash
${packageManager === "npm" ? "npm run" : packageManager} prisma:generate
${packageManager === "npm" ? "npm run" : packageManager} prisma:migrate
\`\`\`
`
    : ""
}

### Running the Server

Development mode:
\`\`\`bash
${devCmd}
\`\`\`

Production mode:
\`\`\`bash
${packageManager === "npm" ? "npm run build" : `${packageManager} build`}
${
  packageManager === "npm"
    ? "npm run start:prod"
    : `${packageManager} start:prod`
}
\`\`\`

The server will start on http://localhost:3000

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check

## Project Structure

\`\`\`
${serverName}/
├── src/
│   ├── app.controller.ts    # Main controller
│   ├── app.service.ts       # Main service
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
${
  database === "Prisma"
    ? "├── prisma/\n│   └── schema.prisma     # Prisma schema\n"
    : ""
}├── test/                    # Test files
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── nest-cli.json            # NestJS CLI configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
\`\`\`

## Package Manager

This project uses **${packageManager}**. 

${
  packageManager !== "npm"
    ? `Make sure you have ${packageManager} installed:
\`\`\`bash
${packageManager === "yarn" ? "npm install -g yarn" : ""}${
        packageManager === "pnpm" ? "npm install -g pnpm" : ""
      }${
        packageManager === "bun"
          ? "curl -fsSL https://bun.sh/install | bash"
          : ""
      }
\`\`\`
`
    : ""
}

## Scripts

- \`${devCmd}\` - Start development server with hot reload
- \`${
    packageManager === "npm" ? "npm run build" : `${packageManager} build`
  }\` - Build the application
- \`${
    packageManager === "npm"
      ? "npm run start:prod"
      : `${packageManager} start:prod`
  }\` - Start production server
- \`${
    packageManager === "npm" ? "npm test" : `${packageManager} test`
  }\` - Run unit tests
- \`${
    packageManager === "npm" ? "npm run test:e2e" : `${packageManager} test:e2e`
  }\` - Run e2e tests
${
  database === "Prisma"
    ? `- \`${
        packageManager === "npm" ? "npm run" : packageManager
      } prisma:generate\` - Generate Prisma client
- \`${
        packageManager === "npm" ? "npm run" : packageManager
      } prisma:migrate\` - Run database migrations
- \`${
        packageManager === "npm" ? "npm run" : packageManager
      } prisma:studio\` - Open Prisma Studio
`
    : ""
}

## Documentation

For more information about NestJS:
- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)

## License

MIT
`;

  fs.writeFileSync(path.join(targetPath, "README.md"), readme);
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

function getDevCommand(packageManager) {
  const commands = {
    npm: "npm run start:dev",
    yarn: "yarn start:dev",
    pnpm: "pnpm start:dev",
    bun: "bun start:dev",
  };
  return commands[packageManager] || "npm run start:dev";
}

module.exports = { generateNestJS };
