// Minimal Node ESM loader for the smoke scripts. The repo relies on webpack for
// two things Node doesn't do natively: the "@/" path alias, and extensionless
// imports (e.g. `export * from "./metering"`). It also has no "type":"module",
// so Node would parse the ESM-syntax lib/*.js as CommonJS. This loader bridges
// all three for scripts run outside Next.
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

const root = pathToFileURL(process.cwd() + "/").href;

export function resolve(specifier, context, next) {
    let target = specifier;
    if (target.startsWith("@/")) {
        target = root + target.slice(2); // "@/lib/x" -> file URL
    } else if (!target.startsWith(".")) {
        return next(specifier, context); // bare specifier (node_modules)
    }
    if (!/\.[mc]?js$|\.json$/.test(target)) {
        target += ".js"; // extensionless relative/alias import
    }
    return next(target, context);
}

export function load(url, context, next) {
    if (url.startsWith(root) && url.endsWith(".js") && !url.includes("/node_modules/")) {
        return { format: "module", source: readFileSync(new URL(url)), shortCircuit: true };
    }
    return next(url, context);
}
