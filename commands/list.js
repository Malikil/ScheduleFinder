const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function() {
    let on = db.getOnStates();
    let off = db.getAllNames().filter(name => !on.includes(name));

    console.log(`Currently online (${on.length}):`);
    // Display in rows of three
    on.forEach((name, i) => {
        if ((i + 1) % 3)
            process.stdout.write(` ${name}  `);
        else
            console.log(` ${name}`);
    });

    console.log(`\nOffline (${off.length}):`);
    off.forEach((name, i) => {
        if ((i + 1) % 3)
            process.stdout.write(` ${name}  `);
        else
            console.log(` ${name}`);
    });
}
