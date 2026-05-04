import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	base: process.env.GITHUB_ACTIONS ? "/winetoast/" : "/",
	plugins: [react()],
	root: __dirname,
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	server: {
		fs: {
			allow: [resolve(__dirname, "..")],
		},
	},
});
