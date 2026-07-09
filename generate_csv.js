const fs = require('fs');

let csv = 'CrimeRate,TimeOfDay,LocationType,RiskLevel\n';
const times = ['Day', 'Night', 'Evening'];
const locs = ['Urban', 'Suburban', 'Rural'];

for(let i = 0; i < 150; i++) {
    let rate = Math.floor(Math.random() * 10) + 1;
    let time = times[Math.floor(Math.random() * times.length)];
    let loc = locs[Math.floor(Math.random() * locs.length)];
    let risk = (rate > 7 || (rate > 5 && time === 'Night')) ? 'High' : (rate < 4 ? 'Low' : 'Medium');
    csv += `${rate},${time},${loc},${risk}\n`;
}

fs.writeFileSync('d:/Rakshak-AI/crime_dataset.csv', csv);
console.log('Generated crime_dataset.csv with 150 rows');
