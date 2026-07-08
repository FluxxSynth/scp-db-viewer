import { commands } from "./commands";
import type { CommandResult } from "./commands";

commands.search = {
    name: "search",
    description: "Search the SCP Foundation database (placeholder — searches scp-wiki).",
    usage: "search [query]",
    execute: async (args): Promise<CommandResult> => {
        if (args.length === 0) {
            return { type: "error", content: "Specify a search query. Usage: search [query]" };
        }

        const query = args.join(" ");
        const searchUrl = `https://www.google.com/search?q=site:scp-wiki.wikidot.com+${encodeURIComponent(query)}`;

        return {
            type: "text",
            content: `\n  Searching for "${query}"...\n` +
                `  Due to Wikidot limitations, please use the following link:\n` +
                `  ${searchUrl}\n\n` +
                `  Or try: access SCP-XXX with a specific number.`,
        };
    },
};
