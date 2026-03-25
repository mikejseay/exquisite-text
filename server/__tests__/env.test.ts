import * as assert from "node:assert/strict";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, it } from "node:test";

const serverDir = path.resolve(__dirname, "..");

describe("env var loading via --env-file-if-exists", () => {
    it("loads env vars from .env file when present", () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-test-"));
        const envFile = path.join(tmpDir, ".env");
        const script = path.join(tmpDir, "check.ts");

        fs.writeFileSync(envFile, "TEST_VAR=hello_from_env\nPORT=9999\n");
        fs.writeFileSync(
            script,
            "console.log(JSON.stringify({ TEST_VAR: process.env.TEST_VAR, PORT: process.env.PORT }));",
        );

        const result = execSync(`node --env-file=${envFile} --import tsx ${script}`, {
            cwd: serverDir,
            encoding: "utf-8",
        });
        const parsed = JSON.parse(result.trim());

        assert.equal(parsed.TEST_VAR, "hello_from_env");
        assert.equal(parsed.PORT, "9999");

        fs.rmSync(tmpDir, { recursive: true });
    });

    it("starts without error when .env file does not exist", () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-test-"));
        const script = path.join(tmpDir, "check.ts");
        const missingEnv = path.join(tmpDir, "nonexistent.env");

        fs.writeFileSync(script, "console.log(JSON.stringify({ PORT: process.env.PORT ?? 'undefined' }));");

        const result = execSync(`node --env-file-if-exists=${missingEnv} --import tsx ${script}`, {
            cwd: serverDir,
            encoding: "utf-8",
        });
        const parsed = JSON.parse(result.trim());

        assert.equal(parsed.PORT, "undefined");

        fs.rmSync(tmpDir, { recursive: true });
    });

    it("env vars are accessible by server modules that use them", () => {
        const envVarsUsed = [
            "PORT",
            "NODE_ENV",
            "HEROKU_URL",
            "AUTHORIZED_BOT_USER_NAME",
            "LOG_LEVEL",
            "OPENAI_API_KEY",
        ];

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-test-"));
        const envFile = path.join(tmpDir, ".env");
        const script = path.join(tmpDir, "check.ts");

        const envContent = envVarsUsed.map((k) => `${k}=test_${k.toLowerCase()}`).join("\n");
        fs.writeFileSync(envFile, envContent);
        fs.writeFileSync(
            script,
            `const vars = ${JSON.stringify(envVarsUsed)};
const result: Record<string, string | undefined> = {};
for (const v of vars) result[v] = process.env[v];
console.log(JSON.stringify(result));`,
        );

        const result = execSync(`node --env-file=${envFile} --import tsx ${script}`, {
            cwd: serverDir,
            encoding: "utf-8",
            env: { PATH: process.env.PATH },
        });
        const parsed = JSON.parse(result.trim());

        for (const key of envVarsUsed) {
            assert.equal(parsed[key], `test_${key.toLowerCase()}`, `${key} should be set from .env`);
        }

        fs.rmSync(tmpDir, { recursive: true });
    });

    it("--env-file errors when file is specified but missing", () => {
        assert.throws(() => {
            execSync("node --env-file=/nonexistent/path/.env -e \"console.log('ok')\"", {
                cwd: serverDir,
                encoding: "utf-8",
                stdio: "pipe",
            });
        });
    });
});
