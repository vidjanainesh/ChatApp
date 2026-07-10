const axios = require("axios");
const tools = require("./toolRegistry");

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

async function routeTool(userMessage, history) {
    const availableTools = Object.values(tools).map(tool => ({
        name: tool.name,
        category: tool.category,
        description: tool.description,
        whenToUse: tool.whenToUse,
        examples: tool.examples,
        parameters: tool.parameters,
    }));

    const prompt = `
You are Dioc's Tool Router.

Your ONLY responsibility is to determine whether one of the available backend tools should be executed.

Do NOT answer the user's question.

Determine the user's intent, not their exact wording.

The conversation history is provided below.

When determining the user's intent, use both:

- the conversation history
- the latest user message

The latest user message may refer to previous messages using words like:
- yes
- no
- one
- it
- him
- her
- them
- that

Resolve these references using the conversation history before selecting a tool.

The available tools contain descriptions, usage guidance, examples, and parameter definitions.

Use that information to select the best matching tool.

If the user's intent matches one of the available tools, select it even if they phrase the request differently.

Focus on what the user wants to accomplish, not on the exact wording.

Available tools:

${JSON.stringify(availableTools, null, 2)}

Return ONLY valid JSON.

Example JSON:

If a tool is needed:

{
  "tool": "getFriends",
  "arguments": {},
  "confidence": 0.98
}

If no tool is needed:

{
  "tool": null,
  "arguments": {},
  "confidence": 0.23
}

Confidence should be a number between 0 and 1.

Use:
- 1.0 when you are certain.
- Around 0.8 - 0.9 when you are fairly confident.
- Around 0.5 when you're unsure.
- Below 0.3 when no tool is appropriate.

Rules:
- Return ONLY JSON.
- Do not explain your answer.
- Do not wrap the JSON in markdown.
- If a tool has no arguments, return an empty object.
`;

    const messages = [
        {
            role: "system",
            content: prompt,
        },
        ...history,
        {
            role: "user",
            content: userMessage,
        },
    ]

    const response = await axios.post(
        "https://router.huggingface.co/v1/chat/completions",
        {
            model: "meta-llama/Llama-3.1-8B-Instruct",
            temperature: 0,
            messages: messages,
        },
        {
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
            },
        }
    );

    const content = response.data.choices[0].message.content;

    const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return JSON.parse(cleaned);
}

module.exports = routeTool;