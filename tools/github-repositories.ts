import { Tool } from "../types.ts";

export const createGithubRepositories = (): Tool => ({
	id: "GithubRepositories",
	description: "Search Github's repositories",
	execute: async (q) => {
		const url =
			`https://api.github.com/search/repositories?${new URLSearchParams(
				{
					q: q.replace(/\W/g, ""),
				},
			)}`;

		const response = await fetch(url);

		const data = await response.json() as {
			total_count: number;
			incomplete_results: boolean;
			items: {
				full_name: string;
				description: string | null;
			}[];
		};

		const output = data.items.filter((item) => item.description !== null)
			.slice(0, 8).map((item) =>
				`* ${item.full_name}: ${item.description}`
			).join("\n");

		return output;
	},
});
