const fs = require('fs');
const https = require('https');
const path = require('path');

const ICONS_DIR = 'icons';

if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR);
}

function getIconUrl(iconPath) {
    if (!iconPath) return null;
    const lowerPath = iconPath.toLowerCase().replace('.tex', '.png');
    return `https://raw.communitydragon.org/latest/game/${lowerPath}`;
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                resolve(false); // Skip if not found
            }
        }).on('error', (err) => {
            console.error(`Error downloading ${url}:`, err.message);
            resolve(false);
        });
    });
}

async function processChampions() {
    try {
        const rawData = fs.readFileSync('set16.json', 'utf8');
        const data = JSON.parse(rawData);

        if (data.champions) {
            const champions = [];

            for (const champ of data.champions) {
                const remoteUrl = getIconUrl(champ.tileIcon);
                let localIconPath = null;

                if (remoteUrl) {
                    const filename = `${champ.apiName}.png`; // Use apiName for unique filename
                    const filepath = path.join(ICONS_DIR, filename);

                    console.log(`Downloading ${champ.name} icon...`);
                    const success = await downloadImage(remoteUrl, filepath);

                    if (success) {
                        localIconPath = `${ICONS_DIR}/${filename}`;
                    } else {
                        console.warn(`Failed to download icon for ${champ.name}`);
                    }
                }

                champions.push({
                    cost: champ.cost,
                    name: champ.name,
                    role: champ.role,
                    stats: champ.stats,
                    traits: champ.traits,
                    ability: champ.ability,
                    icon: localIconPath
                });
            }

            const output = { champions: champions };
            fs.writeFileSync('set16_champions.json', JSON.stringify(output, null, 4));
            console.log(`Successfully extracted ${champions.length} champions to set16_champions.json`);
        } else {
            console.error('Could not find champions in set16.json');
        }
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

processChampions();
