const toolCodes = require("./toolCodes");

module.exports = function buildInternalContext(result) {
    const codeInfo = toolCodes[result.tool]?.[result.code];

    console.log("CodeInfo: ", codeInfo);
    return `
=== INTERNAL CONTEXT ===

The backend may have already executed one or more actions on behalf of the user.

The following information is internal context.

It has NOT been shown to the user.

Do NOT mention tools, backend operations, internal context, JSON, or database fields.

Use this information only to formulate your response naturally.

Rules:

- Never mention tools.
- Never mention JSON.
- Never mention internal ids.
- Never expose database fields.
- Use only the information relevant to the user's request.
- If the action succeeded, simply acknowledge it naturally.
- If the action failed, explain why in a friendly way.

Backend Result

Tool:
${result.tool}

Success:
${result.success}

Status Code:
${result.code}

Meaning:
${codeInfo?.context ?? "No context available."}

Instruction:
${codeInfo?.responseGuidance ?? ""}

Relevant Data:

${JSON.stringify(result.data, null, 2)}

=== END INTERNAL CONTEXT ===
`
}