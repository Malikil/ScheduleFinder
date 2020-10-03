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
 *  }[],
 *  monthly: {
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
 *  }[]
 * }[]}
 */
const data = JSON.parse(fs.readFileSync('data.json'));

/**
 * @param {number[]} args 
 */
module.exports = function(args) {
    let current = data[args[0]];
    if (args.length !== 1 || !current)
    {
        console.log("Shows timetable for the given name");
        console.log("get <name>");
        return;
    }

    console.log(`Looking up times for ${args[0]}`);
    
    const dateFormat = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    let date = new Date(Date.now());
    // Get the times for today and tomorrow
    console.log(`\nToday | ${dateFormat.format(date)}`);
    let onHour = getTime(current, 'on', date);
    let offHour = getTime(current, 'off', date);
    console.log(`${formatHours(onHour)} -> ${formatHours(offHour)}`);

    date.setDate(date.getDate() + 1);
    console.log(`\nTomorrow | ${dateFormat.format(date)}`);
    onHour = getTime(current, 'on', date);
    offHour = getTime(current, 'off', date);
    console.log(`${formatHours(onHour)} -> ${formatHours(offHour)}`);
}

function formatHours(hours) {
    let h = hours | 0;
    let m = ((hours - h) * 60) | 0;
    if (m < 10) m = `0${m}`;
    return `${h}:${m}`;
}

function getTime(obj, type, date) {
    let dayObj = obj.daily[type];
    // If there's no day object, then we don't have any info at all
    if (!dayObj)
        return -1;
    let times = [dayObj.time];

    // Get the weekly times
    let weekObj = obj.weekly[date.getDay()];
    if (weekObj)
        weekObj = weekObj[type];
    if (weekObj)
        times.push(weekObj.time);

    // Get the monthly times
    let monthObj = obj.monthly[date.getDate()];
    if (monthObj)
        monthObj = monthObj[type];
    if (monthObj)
        times.push(monthObj.time);

    return ave24(...times);
}

/**
 * Averages multiple times based on a 24 hour clock,
 * such that the times are closest together
 * @param  {...number} times 
 */
function ave24(...times) {
    // Use a moving average kind of system, base the best fit for future values
    // on what's closest to the moving average of the previous values, then
    // those values can be averaged like normal

    // Keep looping through the list until no values are updated by the moving average
    let movingAverage = times[0];
    let candidateTimes = times.map(time => {
        // Find what the best fit for this time is
        // If negative time is closer than given time, use that.
        // If a time is closer in the negative direction, it won't be closer upwards
        if (Math.abs(movingAverage - (time - 24)) < Math.abs(movingAverage - time))
            time -= 24;
        else if (Math.abs(movingAverage - (time + 24)) < Math.abs(movingAverage - time))
            time += 24;
        // Update the moving average
        movingAverage = (movingAverage + time) / 2;
        return time;
    });
    // Loop again to see if there are differences
    let updatedTimes = times.map(time => {
        if (Math.abs(movingAverage - (time - 24)) < Math.abs(movingAverage - time))
            time -= 24;
        else if (Math.abs(movingAverage - (time + 24)) < Math.abs(movingAverage - time))
            time += 24;
        movingAverage = (movingAverage + time) / 2;
        return time;
    });
    // Continue until there are no further changes
    while (!arraysEqual(candidateTimes, updatedTimes))
    {
        candidateTimes = updatedTimes;
        updatedTimes = times.map(time => {
            if (Math.abs(movingAverage - (time - 24)) < Math.abs(movingAverage - time))
                time -= 24;
            else if (Math.abs(movingAverage - (time + 24)) < Math.abs(movingAverage - time))
                time += 24;
            // Update the moving average
            movingAverage = (movingAverage + time) / 2;
            return time;
        });
    }

    // Now find the simple average of values
    return updatedTimes.reduce((p, c) => p + c) / updatedTimes.length;
}

/**
 * @param {*[]} arr1 
 * @param {*[]} arr2 
 */
function arraysEqual(arr1, arr2) {
    //console.log(arr1);
    //console.log(arr2);
    //console.log("\n");
    if (arr1.length !== arr2.length)
        return false;

    return arr1.every((val, i) => val === arr2[i]);
}
