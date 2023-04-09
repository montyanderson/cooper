import { LLM } from "../types.ts";

export const createGPT3 = (): LLM => {
	const apiKey = Deno.env.get("OPENAI_API_KEY");

	if (apiKey === undefined) {
		throw new Error("Please set OPENAI_API_KEY");
	}

	type CompletionResponse = {
		"id": string;
		"object": string;
		"created": number;
		"choices": [{
			"index": number;
			"message": {
				"role": string;
				"content": string;
			};
			"finish_reason": "stop";
		}];
		"usage": {
			"prompt_tokens": number;
			"completion_tokens": number;
			"total_tokens": number;
		};
	};

	return async (input) => {
		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-3.5-turbo-0301",
					messages: [{ role: "user", content: input }],
				}),
			},
		);

		if (response.status !== 200) {
			throw new Error(`Bad GPT3 Response: ${await response.text()}`);
		}

		const {
			choices: [{
				message: { content },
			}],
		} = await response.json() as CompletionResponse;

		return content;
	};
};
