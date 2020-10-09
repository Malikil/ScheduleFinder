const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function() {
    let on = db.getOnStates();
    let off = db.getAllNames().filter(name => !on.includes(name));

    console.log(`Currently online (${on.length}):`);
    // Display in rows of five
    const COLUMNS = 5;
    on.forEach((name, i) => {
        if ((i + 1) % COLUMNS)
            process.stdout.write(`  ${name} `);
        else
            console.log(`  ${name}`);
    });

    console.log(`\nOffline (${off.length}):`);
    // Group the offline names by their first letter
    groupNames(off, 1).forEach(nameGroup => {
        nameGroup.forEach((name, i) => {
            if ((i + 1) % COLUMNS)
                process.stdout.write(`  ${name} `);
            else
                console.log(`  ${name}`);
        });
        // New line after each group
        // Make sure the group didn't add its own newline
        if (nameGroup.length % COLUMNS)
            console.log();
    });
}

/**
 * @param {string[]} names Array of names
 * @param {number} group How many characters at the start of the word to group by
 * @returns {string[][]}
 */
function groupNames(names, group = 0) {
    // Names should be sorted alphabetically
    names.sort();
    // Then find the groups
    let groups = [];
    let curGroup = [];
    names.forEach(name => {
        // If the current group:
        //  1. Has a value
        //  2. Is different from the current value
        // Then that group is finished, add it to groups and start a new one
        if (curGroup.length > 0 &&
                curGroup[curGroup.length - 1].slice(0, group) !== name.slice(0, group))
        {
            groups.push(curGroup);
            curGroup = [];
        }
        // Add the current name to the current Group
        curGroup.push(name);
    });
    // Once the loop is done make sure the last group is added
    groups.push(curGroup);

    return groups;
}