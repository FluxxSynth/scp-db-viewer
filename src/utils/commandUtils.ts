import { sanitizeHTML } from "./helpers";
import type { CommandResult } from "./commands";

export function renderAsText(result: CommandResult): string {
    if (result.type === "clear" || result.type === "exit") return "";
    if (result.type === "error") return `\n  [ERROR] ${result.content}\n`;
    return `\n${result.content}\n`;
}

export function formatClassification(
    scpClass: string,
    containment: string,
    disruption: string,
    risk: string
): string {
    return [
        `  ${"=".repeat(40)}`,
        `  ${"CLASSIFICATION".padStart(25)}`,
        `  ${"=".repeat(40)}`,
        `  Object Class:    ${scpClass}`,
        `  Containment:     ${containment}`,
        `  Disruption:      ${disruption}`,
        `  Risk:            ${risk}`,
        `  ${"=".repeat(40)}`,
    ].join("\n");
}
