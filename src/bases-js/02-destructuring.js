console.log( process.env );

const { SHELL, NODE, LOGNAME, npm_lifecycle_script } = process.env;

console.table({ SHELL, NODE, LOGNAME, npm_lifecycle_script });

const characters = ["Flash", "Superman", "Green Lantern", "Batman"];

const [, , , batman] = characters;

console.log(batman);
