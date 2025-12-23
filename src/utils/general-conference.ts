import { ConferenceTalkData } from "@/types";

// --- CHANGED: Added createLink parameter ---
export function toCalloutString(talk: ConferenceTalkData, createLink = false) {
    const { url, title, author, content, year, month } = talk;

    const header = `>[!ldslib] [${title}](${url})`;
    const body = content.map((p) => `> ${p}`).join("\n>\n");
    const monthText = [month === 4 ? "April" : "October", year].join(" ");
    
    // Start byline with standard info
    const bylineData = [author.name, author.role, monthText];

    // --- CHANGED: Logic to add the "Hub" Link ---
    if (createLink) {
        bylineData.push("---"); // Separator
        bylineData.push(`[[${title} - ${author.name}]]`); // The Graph Node Link
        bylineData.push("#conference"); 
        // You can add "Topic: [[ ]]" here too if you want it for talks
    }

    const byline = ["[!ldslib-byline]", ...bylineData]
        .map((s) => `>> ${s}`)
        .join("\n");

    return [header, body, byline, ""].join("\n");
}
