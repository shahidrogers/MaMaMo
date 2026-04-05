#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);

function getArg(flag, fallback = null) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

const schemaPath = path.resolve(
  cwd,
  getArg("--schema", "docs/model_input_schema.json"),
);
const historicalPath = path.resolve(
  cwd,
  getArg("--historical", "historical_inputs.csv"),
);
const scenarioPath = path.resolve(
  cwd,
  getArg("--scenario", "scenario_inputs.csv"),
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) {
    throw new Error(`Empty CSV: ${filePath}`);
  }

  const lines = text.split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  const requiredHeaders = ["quarter", "series", "value"];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(
        `${filePath} is missing required column "${header}". Expected long format: quarter,series,value`,
      );
    }
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const values = splitCsvLine(lines[i]);
    const row = Object.fromEntries(headers.map((h, index) => [h, values[index] ?? ""]));
    rows.push({
      line: i + 1,
      quarter: row.quarter.trim(),
      series: row.series.trim(),
      valueRaw: row.value.trim(),
      value: Number(row.value),
    });
  }

  return rows;
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function validateQuarter(quarter) {
  return /^\d{4}Q[1-4]$/.test(quarter);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

const schema = readJson(schemaPath);
const seriesList = schema.series ?? [];
const requiredSeries = seriesList.filter((item) => item.required !== false);
const allowedSeries = new Map(seriesList.map((item) => [item.name, item]));

function loadDataset(name, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${name} file not found at ${path.relative(cwd, filePath)}, skipping.`);
    return null;
  }
  return { name, path: filePath, rows: parseCsv(filePath) };
}

const datasets = [
  loadDataset("historical", historicalPath),
  loadDataset("scenario", scenarioPath),
].filter(Boolean);

if (datasets.length === 0) {
  console.log("No CSV input files found to validate.");
  process.exit(0);
}

for (const dataset of datasets) {
  const seen = new Set();
  const quarters = new Set();
  const seriesByQuarter = new Map();

  for (const row of dataset.rows) {
    if (!validateQuarter(row.quarter)) {
      fail(`${dataset.name} row ${row.line} has invalid quarter "${row.quarter}"`);
    }
    if (!allowedSeries.has(row.series)) {
      fail(`${dataset.name} row ${row.line} uses unknown series "${row.series}"`);
    }
    if (!Number.isFinite(row.value)) {
      fail(`${dataset.name} row ${row.line} has non-numeric value "${row.valueRaw}"`);
    }

    const key = `${row.quarter}::${row.series}`;
    if (seen.has(key)) {
      fail(`${dataset.name} has duplicate observation for ${key}`);
    }
    seen.add(key);
    quarters.add(row.quarter);

    const bucket = seriesByQuarter.get(row.quarter) ?? new Set();
    bucket.add(row.series);
    seriesByQuarter.set(row.quarter, bucket);

    const meta = allowedSeries.get(row.series);
    if (meta.unit?.includes("share") && (row.value < 0 || row.value > 1)) {
      warn(
        `${dataset.name} row ${row.line} has share-valued series "${row.series}" outside [0,1]: ${row.value}`,
      );
    }
    if (meta.unit === "indicator" && ![0, 1].includes(row.value)) {
      warn(
        `${dataset.name} row ${row.line} has indicator series "${row.series}" with non-binary value ${row.value}`,
      );
    }
  }

  const sortedQuarters = [...quarters].sort();
  if (sortedQuarters.length === 0) {
    fail(`${dataset.name} contains no observations`);
    continue;
  }

  for (const quarter of sortedQuarters) {
    const present = seriesByQuarter.get(quarter) ?? new Set();
    const missing = requiredSeries
      .map((item) => item.name)
      .filter((name) => !present.has(name));

    if (missing.length > 0) {
      fail(
        `${dataset.name} quarter ${quarter} is missing ${missing.length} required series: ${missing.join(", ")}`,
      );
    }
  }

  for (let i = 1; i < sortedQuarters.length; i += 1) {
    const previous = sortedQuarters[i - 1];
    const current = sortedQuarters[i];
    if (!isNextQuarter(previous, current)) {
      fail(`${dataset.name} has a quarter gap between ${previous} and ${current}`);
    }
  }
}

function isNextQuarter(previous, current) {
  const [prevYear, prevQuarter] = previous.split("Q").map(Number);
  const [currYear, currQuarter] = current.split("Q").map(Number);
  const nextYear = prevQuarter === 4 ? prevYear + 1 : prevYear;
  const nextQuarter = prevQuarter === 4 ? 1 : prevQuarter + 1;
  return currYear === nextYear && currQuarter === nextQuarter;
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

console.log(
  `Validated ${datasets.length} files against ${requiredSeries.length} required series from ${path.relative(cwd, schemaPath)}.`,
);
