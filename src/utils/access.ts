import { commands } from "./commands";
import type { CommandResult } from "./commands";
import { fetchAndParseArticle } from "./wiki-parser";
import { formatScpNumber } from "./helpers";

commands.access = {
    name: "access",
    description: "Retrieve an SCP article from the database.",
    usage: "access [SCP-XXX]",
    execute: async (args): Promise<CommandResult> => {
        if (args.length === 0) {
            return { type: "error", content: "Specify an SCP to access. Usage: access SCP-XXX" };
        }

        const query = args[0];
        const scpNumber = formatScpNumber(query);
        const urlSlug = `scp-${query.replace(/^scp[-\s]?/i, "").replace(/^0+/, "")}`;

        try {
            const article = await fetchAndParseArticle(urlSlug);

            const content = `
<div class="rendered-content">
${article.rawHtml}
</div>`;

            return { type: "html", content };
        } catch (err) {
            return {
                type: "error",
                content: `Failed to retrieve ${scpNumber}: ${err instanceof Error ? err.message : "Unknown error"}`,
            };
        }
    },
};
