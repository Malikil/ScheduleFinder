const fs = require('fs');

// Make sure the data file exists
if (!fs.existsSync('data.json'))
    fs.writeFileSync('data.json', '{}');
/**
 * @type {{
 *  status: "on"|"off",
 *  daily: {
 *      on?: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off?: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  },
 *  weekly: {
 *      on: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  }[],
 *  monthly: {
 *      on: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  }[]
 * }[]}
 */
const data = JSON.parse(fs.readFileSync('data.json'));

/**
 * @param {string[]} args 
 */
module.exports = function() {
    let online = [];
    let offline = [];
    Object.keys(data).forEach(key => {
        if (data[key].status === 'on')
            online.push(key);
        else
            offline.push(key);
    });

    console.log(`Currently online (${online.length}):`);
    // Display in rows of three
    online.forEach((name, i) => {
        if ((i + 1) % 3)
            process.stdout.write(` ${name}  `);
        else
            console.log(` ${name}`);
    });

    console.log(`\nOffline (${offline.length}):`);
    offline.forEach((name, i) => {
        if ((i + 1) % 3)
            process.stdout.write(` ${name}  `);
        else
            console.log(` ${name}`);
    });
}
