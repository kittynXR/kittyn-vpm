const fs = require('fs');
const https = require('https');
const path = require('path');

// Helper function to make GitHub API requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'kittyn-vpm-readme-updater',
        'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : ''
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Extract repository name from package name using the pattern cat.kittyn.repo-name
function getRepositoryName(packageName) {
  // Handle the standard pattern: cat.kittyn.repo-name -> kittynXR/repo-name
  if (packageName.startsWith('cat.kittyn.')) {
    const repoName = packageName.replace('cat.kittyn.', '');
    return `kittynXR/${repoName}`;
  }
  
  // Fallback for other patterns - could be extended in the future
  console.warn(`Package name '${packageName}' doesn't follow expected pattern cat.kittyn.*`);
  return null;
}

// Extract latest version from releases array
function getLatestVersion(releases) {
  if (!releases || releases.length === 0) return 'Unknown';
  
  // Extract version from URL (e.g., "v1.0.3" from release URL)
  const versionMatch = releases[0].match(/\/v?(\d+\.\d+\.\d+)\//);
  return versionMatch ? `v${versionMatch[1]}` : 'Unknown';
}

// Fetch package metadata from GitHub API
async function fetchPackageMetadata(repoName) {
  try {
    console.log(`Fetching metadata for repository: ${repoName}`);
    const repoData = await makeRequest(`https://api.github.com/repos/${repoName}`);
    const releasesData = await makeRequest(`https://api.github.com/repos/${repoName}/releases/latest`);
    
    console.log(`Successfully fetched metadata for ${repoName}: ${releasesData.tag_name || 'no release'}`);
    return {
      name: repoData.name,
      description: repoData.description || 'No description available',
      url: repoData.html_url,
      version: releasesData.tag_name || 'Unknown'
    };
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${repoName}: ${error.message}`);
    // Return a default structure instead of null for better handling
    return {
      name: repoName.split('/')[1],
      description: 'No description available',
      url: `https://github.com/${repoName}`,
      version: 'Unknown'
    };
  }
}

// Enhanced package metadata with known information
function getEnhancedPackageInfo(packageName) {
  const enhancedInfo = {
    'cat.kittyn.comfi-hierarchy': {
      displayName: 'cátte — Comfi Hierarchy',
      description: 'QoL Hierarchy UI for VRChat Creators — Customizable'
    },
    'cat.kittyn.enhanced-dynamics': {
      displayName: 'cátte — Enhanced Dynamics', 
      description: 'UI Enhancements for VRChat Dynamics (viewport handles, physics preview)'
    },
    'cat.kittyn.immersive-scaler': {
      displayName: 'cátte — Immersive Scaler',
      description: 'Rizz up your immersion! No blender required and non-destructive!'
    }
  };
  
  return enhancedInfo[packageName] || null;
}

// Generate markdown for packages section
async function generatePackagesSection(packages) {
  let markdown = '## 🎮 Available Packages\n\n';
  
  console.log(`Processing ${packages.length} packages...`);
  
  for (const pkg of packages) {
    console.log(`Processing package: ${pkg.name}`);
    
    const repoName = getRepositoryName(pkg.name);
    const enhancedInfo = getEnhancedPackageInfo(pkg.name);
    const latestVersion = getLatestVersion(pkg.releases);
    
    if (!repoName) {
      console.error(`Skipping package ${pkg.name}: Unable to determine repository name`);
      continue;
    }
    
    // Use enhanced info if available, otherwise fetch from GitHub
    let displayName = pkg.name;
    let description = 'No description available';
    
    if (enhancedInfo) {
      console.log(`Using enhanced info for ${pkg.name}`);
      displayName = enhancedInfo.displayName;
      description = enhancedInfo.description;
    } else {
      console.log(`Fetching GitHub info for ${pkg.name}`);
      const githubInfo = await fetchPackageMetadata(repoName);
      displayName = githubInfo.name;
      description = githubInfo.description;
    }
    
    markdown += `### ${displayName}\n`;
    markdown += `${description}\n`;
    markdown += `- **Repository**: [${repoName}](https://github.com/${repoName})\n`;
    markdown += `- **Latest Version**: ${latestVersion}\n\n`;
    
    console.log(`✓ Processed ${displayName} (${latestVersion})`);
  }
  
  console.log('Packages section generation completed');
  return markdown;
}

// Update README.md with new packages section
async function updateReadme() {
  try {
    console.log('Starting README update process...');
    
    // Read source.json
    console.log('Reading source.json...');
    const sourceData = JSON.parse(fs.readFileSync('source.json', 'utf8'));
    console.log(`Found ${sourceData.packages.length} packages in source.json`);
    
    // Generate packages section
    console.log('Generating packages section...');
    const packagesSection = await generatePackagesSection(sourceData.packages);
    
    // Read current README
    const readmePath = 'README.md';
    console.log('Reading current README.md...');
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Find the packages section and replace it
    const packagesStartRegex = /## 🎮 Available Packages/;
    const nextSectionRegex = /## 📦 How to Add to VCC/;
    
    const startMatch = readmeContent.match(packagesStartRegex);
    const endMatch = readmeContent.match(nextSectionRegex);
    
    if (startMatch && endMatch) {
      console.log('Found existing packages section, replacing...');
      // Replace the packages section
      const beforePackages = readmeContent.substring(0, startMatch.index);
      const afterPackages = readmeContent.substring(endMatch.index);
      
      readmeContent = beforePackages + packagesSection + afterPackages;
    } else {
      console.log('Packages section not found, inserting after first paragraph...');
      // If sections not found, insert after the first paragraph
      const lines = readmeContent.split('\n');
      const insertIndex = lines.findIndex(line => line.trim() === '') + 1;
      
      lines.splice(insertIndex, 0, '', packagesSection.trim(), '');
      readmeContent = lines.join('\n');
    }
    
    // Write updated README
    console.log('Writing updated README.md...');
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log('✅ README.md updated successfully with package information');
    
  } catch (error) {
    console.error('❌ Error updating README:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the update
updateReadme();