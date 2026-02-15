// scripts/trace-punycode.cjs
const Module = require("node:module");

const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  // "punycode" triggers Node core module (DEP0040)
  if (request === "punycode" || request === "node:punycode") {
    const from = parent?.filename || "(unknown parent)";
    // Print a short stack so you can see the exact import chain
    console.error("\n=== PUNYCODE REQUIRED ===");
    console.error("request:", request);
    console.error("from:", from);
    console.error(new Error("import stack").stack);
    console.error("========================\n");
  }
  return originalLoad.apply(this, arguments);
};
