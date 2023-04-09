import { Tool } from "../types.ts";
import { JSDOM } from "https://jspm.dev/jsdom";

export const createDuckDuckGo = (): Tool => ({
	id: "DuckDuckGo",
	description: "Search the web using DuckDuckGo's API",
	execute: async (q) => {
		const url = `https://html.duckduckgo.com/html/?${new URLSearchParams({
			q: q.replace(/\W/g, ""),
		})}`;

		const response = await fetch(url);

		const text = await response.text();

		const dom = new JSDOM(text);

		const snippets = dom.window.document.querySelectorAll(
			".result__snippet",
		);

		const output = [
			...snippets,
		].slice(0, 8).map((snippet) => `* ${snippet.textContent}`).join("\n");

		return output;
	},
});
