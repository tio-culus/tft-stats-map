const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'tft-champion.json');
const outputFile = path.join(__dirname, 'tft-set16-champions.json');
const filterPrefix = 'Maps/Shipping/Map22/Sets/TFTSet16/';

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const json = JSON.parse(data);

    const filteredData = {};

    if (json.data) {
        for (const key in json.data) {
            if (key.startsWith(filterPrefix)) {
                filteredData[key] = json.data[key];
            }
        }
    }

    const result = {
        type: json.type,
        version: json.version,
        data: filteredData
    };

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 4), 'utf8');
    console.log(`Successfully created ${outputFile} with ${Object.keys(filteredData).length} entries.`);

} catch (err) {
    console.error('Error processing file:', err);
}
