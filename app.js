const fs = require("fs");
const data = fs.readFileSync("README.md", "utf8");
const newContent = data.replace(/Vue/ig, "Laravel");

fs.writeFileSync("NEW_README.md", newContent, "utf8");
