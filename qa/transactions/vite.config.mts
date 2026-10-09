import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../../",import.meta.url));
export default defineConfig({root:fileURLToPath(new URL("./",import.meta.url)),publicDir:`${root}/public`,cacheDir:`${root}/qa/transactions/.cache`,resolve:{alias:{"next/navigation":fileURLToPath(new URL("./navigation.ts",import.meta.url)),"next/link":fileURLToPath(new URL("./link.tsx",import.meta.url)),"@":`${root}/src`}},build:{outDir:".build",emptyOutDir:true,copyPublicDir:false},server:{host:"127.0.0.1",port:8818,strictPort:true,fs:{allow:[root]}}});
