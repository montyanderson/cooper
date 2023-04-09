#!/usr/bin/env deno run --allow-net --allow-env
import * as colors from "https://deno.land/std@0.182.0/fmt/colors.ts";
import { createBasicAgent } from "./agents/basic.ts";
import { createGPT3 } from "./llms/gpt3.ts";
import { createDuckDuckGo } from "./tools/duckduckgo.ts";

const agent = createBasicAgent({
	llm: createGPT3(),
	tools: [
		createDuckDuckGo(),
	],
	question: Deno.args[0] as string,
});

for await (const { type, message } of agent) {
	switch (type) {
		case "thought":
			console.log("💭", message);
			break;

		case "action":
			console.log("🌐", colors.dim(message), "\n");
			break;

		case "answer":
			console.log("🔥", message);
			break;
	}
}

Deno.exit(0);
