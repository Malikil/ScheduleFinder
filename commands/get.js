const db = require('../data-manager');

/**
 * @param {number[]} args 
 */
module.exports = function(args) {
    let now = new Date();
    let times = db.getTimes(args[0], now);
    if (args.length !== 1 || !times.lastUpdate)
    {
        console.log("Shows timetable for the given name");
        console.log("get <name>");
        return;
    }

    // Display the next 6 hours of times in a line graph
    // Each row will indicate 10% state confidence
    // Labels can be each hour, on the bottom row
    let print = (row, min, max) => {
        row.forEach(val => {
            if (val >= min && val < max)
                process.stdout.write('*');
            else
                process.stdout.write(' ');
        });
    };
    console.log(`6-hour chart for ${args[0]}`);
    process.stdout.write('1.0|'); print(times.future, 1.0, 1.1); console.log();
    process.stdout.write('   |'); print(times.future, 0.9, 1.0); console.log();
    process.stdout.write('   |'); print(times.future, 0.8, 0.9); console.log();
    process.stdout.write('   |'); print(times.future, 0.7, 0.8); console.log();
    process.stdout.write('   |'); print(times.future, 0.6, 0.7); console.log();
    process.stdout.write('0.5|'); print(times.future, 0.5, 0.6); console.log();
    process.stdout.write('   |'); print(times.future, 0.4, 0.5); console.log();
    process.stdout.write('   |'); print(times.future, 0.3, 0.4); console.log();
    process.stdout.write('   |'); print(times.future, 0.2, 0.3); console.log();
    process.stdout.write('   |'); print(times.future, 0.1, 0.2); console.log();
    process.stdout.write('0.0|'); print(times.future, 0.0, 0.1); console.log();
    // Now print the labels
    process.stdout.write('    ');
    console.log();
    console.log(`Last update: ${
        new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }).format(times.lastUpdate.time)
    }`);
}

