import { commands } from "./commands";
import type { CommandResult } from "./commands";
import { fetchAndParseArticle } from "./wiki-parser";
import { formatScpNumber, stripHTML } from "./helpers";
import { formatClassification } from "./commandUtils";

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
            const classification = formatClassification(
                article.classification.class,
                article.classification.containment,
                article.classification.disruption,
                article.classification.risk
            );

            const content = [
                `\n  ${"═".repeat(40)}`,
                `  ${article.title}`,
                `  ${"═".repeat(40)}`,
                ``,
                classification,
                ``,
                `  ${"─".repeat(40)}`,
                `  ARTICLE`,
                `  ${"─".repeat(40)}`,
                ``,
                article.plainText,
            ].join("\n");

            return { type: "text", content };
        } catch (err) {
            return {
                type: "error",
                content: `Failed to retrieve ${scpNumber}: ${err instanceof Error ? err.message : "Unknown error"}`,
            };
        }
    },
};
