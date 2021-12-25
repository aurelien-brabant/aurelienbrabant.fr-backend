import { readdirSync, readFileSync } from "fs";
import { createBlogpostFromMarkdown } from "../services/blogposts";

const main = async () => {
	try {
		const dir = process.argv[2];
		const filepaths = readdirSync(dir);

		const mdFilepaths = filepaths.filter((filename) =>
			filename.endsWith(".md")
		);

		for (const mdFilepath of mdFilepaths) {
			const fileContent = readFileSync(dir + "/" + mdFilepath);

			console.log(`Processing ${mdFilepath}...`);

			const errors = await createBlogpostFromMarkdown(fileContent.toString());

			if (errors.length !== 0) {
				console.error(errors);
			}
		}
	} catch (e) {
		console.error(e);
	}
};

if (process.argv.length !== 3) {
	console.error(
		"Usage: ts-node migrate_from_markdown.ts <path/to/directory/that/contains/markdown/files>"
	);
	process.exit(1);
}

main();
