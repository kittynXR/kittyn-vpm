#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node update-package.js <package_name> <release_url>');
    process.exit(1);
}

const [packageName, releaseUrl] = args;

// Read source.json
const sourceJsonPath = path.join(__dirname, '..', 'source.json');
let sourceData;

try {
    const content = fs.readFileSync(sourceJsonPath, 'utf8');
    sourceData = JSON.parse(content);
} catch (error) {
    console.error('Error reading source.json:', error.message);
    process.exit(1);
}

// Find existing package or create new entry
let packageEntry = sourceData.packages.find(pkg => pkg.name === packageName);

if (packageEntry) {
    console.log(`Updating existing package: ${packageName}`);
    
    // Add new release URL at the beginning (latest first)
    if (!packageEntry.releases.includes(releaseUrl)) {
        packageEntry.releases.unshift(releaseUrl);
        
        // Keep only the last 10 releases
        if (packageEntry.releases.length > 10) {
            packageEntry.releases = packageEntry.releases.slice(0, 10);
        }
    } else {
        console.log(`Release URL already exists for ${packageName}`);
    }
} else {
    console.log(`Adding new package: ${packageName}`);
    
    // Create new package entry
    packageEntry = {
        name: packageName,
        releases: [releaseUrl]
    };
    
    sourceData.packages.push(packageEntry);
    
    // Sort packages alphabetically by name
    sourceData.packages.sort((a, b) => a.name.localeCompare(b.name));
}

// Write updated source.json
try {
    const updatedContent = JSON.stringify(sourceData, null, 4) + '\n';
    fs.writeFileSync(sourceJsonPath, updatedContent);
    console.log('Successfully updated source.json');
} catch (error) {
    console.error('Error writing source.json:', error.message);
    process.exit(1);
}

// Display summary
console.log(`\nPackage: ${packageName}`);
console.log(`Latest release: ${releaseUrl}`);
console.log(`Total releases tracked: ${packageEntry.releases.length}`);
console.log(`Total packages in repository: ${sourceData.packages.length}`);