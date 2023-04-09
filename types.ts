export type LLM = (input: string) => Promise<string>;

export type Tool = {
	id: string;
	description: string;
	execute: (input: string) => Promise<string>;
};
