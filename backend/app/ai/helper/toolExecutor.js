const tools = require("./toolRegistry");

async function executeTool(toolName, params = {}) {

    const tool = tools[toolName];

    if (!tool) {
        return {
            tool: toolName,
            success: false,
            data: null,
            error: "Tool not found",
        };
    }

    return await tool.execute(params);
}

module.exports = executeTool;