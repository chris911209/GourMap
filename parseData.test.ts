import { expect, it } from "bun:test";

it("rejects the removed --no-geocode CLI flag", async () => {
    const process = Bun.spawn(["bun", "run", "parseData.ts", "taipei.csv", "--no-geocode"], {
        cwd: import.meta.dir,
        stdout: "pipe",
        stderr: "pipe",
    });

    const exitCode = await process.exited;
    const stderr = await new Response(process.stderr).text();

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("--no-geocode");
});
