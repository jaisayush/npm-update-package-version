#!/usr/bin/env node

const axios = require("axios");
const Table = require("cli-table3");
const fs = require("fs");
const path = require("path");
const ini = require("ini");
const chalk = require("chalk");
const os = require("os");
const homeDirectory = os.homedir();

// Get the latest version for each package in package.json
const getLatestVersions = async () => {
  // Read the package.json file
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJsonExists = fs.existsSync(packageJsonPath);
  const packageJson = packageJsonExists
    ? require(packageJsonPath)
    : { dependencies: {}, devDependencies: {} };

  // Read the .npmrc file
  const npmrcPath = path.join(homeDirectory || "/", ".npmrc");
  const npmrcExists = fs.existsSync(npmrcPath);
  const npmrc = npmrcExists
    ? ini.parse(fs.readFileSync(npmrcPath, "utf-8"))
    : {};

  // Use the registry URL from the .npmrc file if present
  const registryUrl =
    npmrc.registry?.trim()?.replace(/\/?$/, "/") ||
    "https://registry.npmjs.org/-/v1/search?text=";

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const packages = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ];
  const latestVersions = {};

  // Loop through each package and get the latest version from the registry
  for (const pkg of packages) {
    const response = await axios.get(`${registryUrl}${pkg}`);
    const {
      package: { version },
    } = response.data.objects[0];

    latestVersions[pkg] = version;
  }

  return latestVersions;
};

// Log the latest versions in a table
const logTable = (data) => {
  const table = new Table({
    head: [
      "Package Name",
      "Current Version",
      "Latest Version",
      "Update Available",
    ],
    colWidths: [30, 20, 20, 25],
  });

  const rows = [];

  for (const [pkg, latestVersion] of Object.entries(data)) {
    const packageJsonPath = path.join(
      process.cwd(),
      "node_modules",
      pkg,
      "package.json"
    );
    const packageJsonExists = fs.existsSync(packageJsonPath);
    const currentVersion = packageJsonExists
      ? require(packageJsonPath).version
      : "";

    const isMajorChange =
      currentVersion &&
      latestVersion.split(".")[0] !== currentVersion.split(".")[0];
    const colorFn = isMajorChange ? chalk.redBright : chalk.greenBright;

    rows.push([
      pkg,
      currentVersion,
      colorFn(latestVersion),
      latestVersion > currentVersion ? chalk.green("✔") : chalk.red("✘"),
    ]);
  }

  table.push(...rows);

  console.log("Latest versions of dependencies and dev-dependencies:");
  console.log(table.toString());
};

const run = async () => {
  // Check if the node_modules directory exists
  if (!fs.existsSync(path.join(process.cwd(), "node_modules"))) {
    console.error(
      "Error: Please run the command in the directory with the package.json file and run `npm install` first."
    );
    return;
  }

  const latestVersions = await getLatestVersions();

  logTable(latestVersions);
};

run();

module.exports = { getLatestVersions, logTable, run };
