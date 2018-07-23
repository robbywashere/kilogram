const readline = require('readline');

module.exports = function prompt(msg) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${msg}:`, (answer) => {
      console.log('!!!!!');
      rl.close();
      resolve(answer.replace(/\n$/, ''));
    });
  });
};
