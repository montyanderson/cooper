import { LLM, Tool } from "../types.ts";

// tokens for parsing
const thoughtPrefix = `Thought: `;
const actionPrefix = `ActionId: `;
const actionInputPrefix = `ActionInput: `;
const finalAnswerPrefix = `Final Answer: `;

const createInitialPrompt = (question: string, tools: Tool[]) =>
	`
Today is ${new Date()}.

You are an agent that works in a Question, Thought, Action loop.
You can use tools to get new information. Answer the question as best as you can using the following tools: 

${tools.map((tool) => `${tool.id}: ${tool.description}`).join("\n")}

Use the following format:
Question: the input question you must answer
${thoughtPrefix}comment on what you want to do next
${actionPrefix}the action to take, exactly one element of [{tool_names}]
${actionInputPrefix}the input to the action
Observation: the result of the action
${thoughtPrefix}comment on what you want to do next
${actionPrefix}the action to take, exactly one element of [{tool_names}]
${actionInputPrefix}the input to the action
Observation: the result of the action
${thoughtPrefix}comment on what you want to do next
${actionPrefix}the action to take, exactly one element of [{tool_names}]
${actionInputPrefix}the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation repeats N times, use it until you are sure of the answer)
Thought: I now know the final answer
${finalAnswerPrefix}your final answer to the original input question

Begin!
Question: ${question}
`.trim();

type AnswerResponse = {
	type: "answer";
	answer: string;
};

type ActionResponse = {
	type: "action";
	thought: string;
	actionId: string;
	actionInput: string;
};

const parseResponse = (
	response: string,
): ActionResponse | AnswerResponse | undefined => {
	const answer = response.split("\n").slice(0, 3).find((line) =>
		line.startsWith(finalAnswerPrefix)
	);

	if (answer) {
		return {
			type: "answer",
			answer: answer.slice(finalAnswerPrefix.length),
		};
	}

	const [thoughtLine, actionIdLine, actionInputLine] = response.split(
		"\n",
	)
		.slice(0, 3);

	if (
		!thoughtLine || !thoughtLine.startsWith(thoughtPrefix) ||
		!actionIdLine || !actionIdLine.startsWith(actionPrefix) ||
		!actionInputLine || !actionInputLine.startsWith(actionInputPrefix)
	) {
		return undefined;
	}

	const thought = thoughtLine.slice(thoughtPrefix.length);
	const actionId = actionIdLine.slice(actionPrefix.length);
	const actionInput = actionInputLine.slice(actionInputPrefix.length);

	return { type: "action", thought, actionId, actionInput };
};

const stringifyObservation = (
	action: ActionResponse,
	observation: string,
) => `
${thoughtPrefix}${action.thought}
${actionPrefix}${action.actionId}
${actionInputPrefix}${action.actionInput}
Observation: ${observation}`;

export const createBasicAgent = async function* ({ llm, tools, question }: {
	llm: LLM;
	tools: Tool[];
	question: string;
}) {
	let prompt = createInitialPrompt(question, tools);

	for (;;) {
		const response = parseResponse(await llm(prompt));

		if (response === undefined) {
			// failed to parse response
			continue;
		}

		if (response.type === "action") {
			yield { type: "thought", message: response.thought };

			const tool = tools.find((tool) => tool.id === response.actionId);
			if (tool === undefined) continue;

			yield {
				type: "action",
				message: `${response.actionId} -> ${response.actionInput}`,
			};

			const observation = await tool.execute(response.actionInput);

			prompt += stringifyObservation(response, observation);
		}

		if (response.type === "answer") {
			yield {
				type: "answer",
				message: response.answer,
			};

			break;
		}
	}
};
