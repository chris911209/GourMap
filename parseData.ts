import cliProgress, { SingleBar } from "cli-progress";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs as parseNodeArgs } from "node:util";
import { convertCsvToRestaurantDataset, type ConversionProgressEvent } from "./src/lib/converter";

type CliOptions = {
    inputPath: string;
    outputPath: string;
    schemaPath: string;
};

const DEFAULT_SCHEMA_PATH = "./restaurants.schema.json";

async function main() {
    const options = parseCliArgs(process.argv.slice(2));
    const csvText = await readFile(options.inputPath, "utf8");
    const progressBar = new cliProgress.SingleBar(
        {
            format: "Converting [{bar}] {percentage}% | {value}/{total} | {name}",
            hideCursor: true,
        },
        cliProgress.Presets.shades_classic,
    );

    try {
        const dataset = await convertCsvToRestaurantDataset(csvText, {
            schemaPath: options.schemaPath,
            onProgress(event: ConversionProgressEvent) {
                handleProgress(progressBar, event);
            },
        });

        progressBar.stop();

        await writeFile(options.outputPath, `${JSON.stringify(dataset, null, 4)}\n`, "utf8");
        console.log(`Wrote ${dataset.items.length} restaurant(s) to ${options.outputPath}`);
    } finally {
        progressBar.stop();
    }
}

function handleProgress(progressBar: SingleBar, event: ConversionProgressEvent) {
    if (event.type === "start") {
        progressBar.start(event.totalRows, 0, {
            name: "starting",
        });
        return;
    }

    if (event.type === "row") {
        progressBar.update(event.rowIndex, {
            name: event.name,
        });
        return;
    }

    progressBar.update(event.itemCount, {
        name: "done",
    });
}

function parseCliArgs(args: string[]): CliOptions {
    const { positionals, values } = parseNodeArgs({
        args,
        allowPositionals: true,
        options: {
            out: {
                type: "string",
            },
            schema: {
                type: "string",
            },
        },
        strict: true,
    });

    if (positionals.length === 0) {
        throw new Error(
            "Usage: bun run parseData.ts <input.csv> [--out output.json] [--schema ./restaurants.schema.json]",
        );
    }

    if (positionals.length > 1) {
        throw new Error(`Unexpected positional arguments: ${positionals.slice(1).join(", ")}`);
    }

    const inputPath = resolve(positionals[0]);
    const schemaPath = values.schema ?? DEFAULT_SCHEMA_PATH;
    let outputPath = values.out ? resolve(values.out) : "";

    if (outputPath === "") {
        const inputDir = dirname(inputPath);
        const inputBase = basename(inputPath, extname(inputPath));
        outputPath = join(inputDir, `${inputBase}.json`);
    }

    return {
        inputPath,
        outputPath,
        schemaPath,
    };
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
