const fs = require('fs');
// Convert all args to lower case by default
const cmd = process.argv.slice(2).map(x => x.toLowerCase());

// Get a list of files from commands, those will be the available commands
const commands = fs.readdirSync('./commands/');

// If there are no arguments, or if the selected arg isn't available.
// Show available commands
if (cmd.length < 1 || !commands.includes(`${cmd[0]}.js`))
{
   console.log("Available commands:");
   commands.forEach(comm => console.log(`  ${comm.slice(0, -3)}`));
}
else
{
    // Find and call the appropriate command
    const called = require(`./commands/${cmd[0]}`);
    called(cmd.slice(1));
}