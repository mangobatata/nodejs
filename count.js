const fs = require("fs");
const content = fs.readFileSync("README.md", "utf8");
const nuxtWordCount = (content.match(/Nuxt/gi) || []).length;

console.log(`The word "Nuxt" appears ${nuxtWordCount} times in README.md.`);
