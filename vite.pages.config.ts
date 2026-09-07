import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
 root:fileURLToPath(new URL("./pages",import.meta.url)),
 base:"/tictactoe/",
 publicDir:fileURLToPath(new URL("./public",import.meta.url)),
 plugins:[react()],
 css:{postcss:{plugins:[tailwindcss()]}},
 resolve:{alias:{"@":fileURLToPath(new URL(".",import.meta.url))},dedupe:["react","react-dom","three"]},
 build:{outDir:fileURLToPath(new URL("./out",import.meta.url)),emptyOutDir:true}
});
