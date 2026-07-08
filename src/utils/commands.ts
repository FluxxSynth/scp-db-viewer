import { fetchAndParseArticle } from "./wiki-parser";
import { sanitizeHTML } from "./helpers";

export interface CommandResult {
    type: "text" | "html" | "error" | "clear" | "exit";
    content: string;
}

export interface Command {
    name: string;
    description: string;
    usage: string;
    execute: (args: string[]) => Promise<CommandResult>;
}

export type CommandMap = Record<string, Command>;

// History storage
export let commandHistory: string[] = [];

export function addToHistory(cmd: string) {
    commandHistory.push(cmd);
    if (commandHistory.length > 100) commandHistory.shift();
}

export function getHistory(): string[] {
    return commandHistory;
}

export const commands: CommandMap = {};

// ── help ──
commands.help = {
    name: "help",
    description: "Display available commands or details about a specific command.",
    usage: "help [command]",
    execute: async (args) => {
        if (args.length > 0) {
            const cmd = commands[args[0]];
            if (!cmd) return { type: "error", content: `Unknown command: ${args[0]}. Type 'help' for a list.` };
            return {
                type: "text",
                content: `${cmd.name}\n  ${cmd.description}\n  Usage: ${cmd.usage}`,
            };
        }
        const list = Object.keys(commands)
            .sort()
            .map((name) => `  ${name.padEnd(15)} ${commands[name].description}`)
            .join("\n");
        return {
            type: "text",
            content: `SCP DATABASE TERMINAL — COMMANDS\n${"─".repeat(40)}\n\n${list}\n\nType 'help [command]' for details.`,
        };
    },
};

// ── clear ──
commands.clear = {
    name: "clear",
    description: "Clear the terminal screen.",
    usage: "clear",
    execute: async () => ({ type: "clear", content: "" }),
};

// ── exit ──
commands.exit = {
    name: "exit",
    description: "Close the terminal application.",
    usage: "exit",
    execute: async () => ({ type: "exit", content: "" }),
};

// ── history ──
commands.history = {
    name: "history",
    description: "Show command history.",
    usage: "history",
    execute: async () => {
        if (commandHistory.length === 0) return { type: "text", content: "No commands in history." };
        const lines = commandHistory.map((cmd, i) => `  ${String(i + 1).padStart(3)}  ${cmd}`).join("\n");
        return { type: "text", content: `Command History:\n${lines}` };
    },
};

// ── manual ──
commands.manual = {
    name: "manual",
    description: "Show the SCP Foundation Manual (abridged).",
    usage: "manual",
    execute: async () => ({
        type: "text",
        content: `\x1b[32m=== SCP FOUNDATION MANUAL (ABRIDGED) ===\x1b[0m

\x1b[33m1. FOUNDATION OVERVIEW\x1b[0m
Operating since 18██, the SCP Foundation is a global organization
tasked with securing anomalous objects, entities, and phenomena.

\x1b[33m2. OBJECT CLASSIFICATION\x1b[0m
  Safe       - Easily contained
  Euclid     - Unpredictable, requires more resources
  Keter      - Highly dangerous, difficult to contain
  Thaumiel   - Used to contain other SCPs
  Neutralized - No longer anomalous
  Explained  - Anomaly explained by science
  Decommissioned / Pending

\x1b[33m3. CONTAINMENT CLASSES\x1b[0m
  Standard, Anomalous, Esoteric, Thaumiel, Neutralized

\x1b[33m4. DISRUPTION CLASSES\x1b[0m
  Dark, Vlam, Keneq, Ekhi, Amida

\x1b[33m5. RISK CLASSES\x1b[0m
  Notice, Warning, Critical, Danger, Unknown

\x1b[33m6. COMMON COMMANDS\x1b[0m
  access [SCP-XXX]  - Retrieve an SCP article
  search [query]    - Search for SCPs
  help              - Show command list
  clear             - Clear terminal

Type 'access SCP-002' to begin.`,
    }),
};
