const fs = require('fs');
const https = require('https');
const path = require('path');

const ICONS_DIR = 'icons';
const DATA_DIR = 'data';
const VERSIONS_FILE = 'versions.json';

// Get version from command line argument
const version = process.argv[2];
if (!version) {
    console.error('Usage: node extract_set16.js <version>');
    console.error('Example: node extract_set16.js 15.24.1');
    process.exit(1);
}

// Create directories if they don't exist
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR);
}
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
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

function updateVersionsFile(version, filename) {
    let versionsData = { versions: [], latest: null };

    // Read existing versions file if it exists
    if (fs.existsSync(VERSIONS_FILE)) {
        try {
            versionsData = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
        } catch (e) {
            console.warn('Could not parse versions.json, creating new one');
        }
    }

    // Check if version already exists
    const existingIndex = versionsData.versions.findIndex(v => v.version === version);
    const versionEntry = {
        version: version,
        date: new Date().toISOString().split('T')[0],
        file: filename
    };

    if (existingIndex >= 0) {
        // Update existing entry
        versionsData.versions[existingIndex] = versionEntry;
        console.log(`Updated existing version ${version} in versions.json`);
    } else {
        // Add new entry
        versionsData.versions.push(versionEntry);
        console.log(`Added version ${version} to versions.json`);
    }

    // Sort versions (newest first based on version string)
    versionsData.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

    // Update latest
    versionsData.latest = versionsData.versions[0].version;

    fs.writeFileSync(VERSIONS_FILE, JSON.stringify(versionsData, null, 4));
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

                    // Only download if not already exists
                    if (!fs.existsSync(filepath)) {
                        console.log(`Downloading ${champ.name} icon...`);
                        const success = await downloadImage(remoteUrl, filepath);

                        if (success) {
                            localIconPath = `${ICONS_DIR}/${filename}`;
                        } else {
                            console.warn(`Failed to download icon for ${champ.name}`);
                        }
                    } else {
                        localIconPath = `${ICONS_DIR}/${filename}`;
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

            // Create output with version metadata
            const output = {
                version: version,
                extractedAt: new Date().toISOString(),
                champions: champions
            };

            // Save versioned file to data directory
            const versionedFilename = `${DATA_DIR}/set16_v${version}.json`;
            fs.writeFileSync(versionedFilename, JSON.stringify(output, null, 4));
            console.log(`Saved versioned data to ${versionedFilename}`);

            // Also save as set16_champions.json for backward compatibility
            fs.writeFileSync('set16_champions.json', JSON.stringify(output, null, 4));
            console.log(`Updated set16_champions.json (latest)`);

            // Update versions registry
            updateVersionsFile(version, versionedFilename);

            console.log(`\nSuccessfully extracted ${champions.length} champions for version ${version}`);
        } else {
            console.error('Could not find champions in set16.json');
        }
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

processChampions();
