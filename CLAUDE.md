# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VPM (VRChat Package Manager) Package Listing Template - a starter template for creating and maintaining VRChat package repositories compatible with VRChat Creator Companion (VCC).

## Key Commands

### Testing and Deployment
- **Deploy changes**: Push to `main` branch - GitHub Actions automatically builds and deploys
- **Manual build**: Go to Actions tab → "Build Repo Listing" → "Run workflow"
- **Check build status**: Visit the Actions tab to monitor deployment progress

### Local Development
No local build commands are required. All changes are tested through GitHub Actions after pushing to the repository.

## Architecture and Structure

### Core Configuration
- **source.json**: Main configuration file containing:
  - Listing metadata (name, id, author, description)
  - Package sources (GitHub repos and direct ZIP URLs)
  - **CRITICAL**: The `url` field is set to: `https://vpm.kittyn.cat/index.json` (custom domain)

### Directory Structure
- **/Website/**: Landing page assets (index.html, app.js, styles.css)
  - Content is auto-populated from source.json
  - Uses Fluent UI web components for UI
- **/.github/workflows/**: Contains build-listing.yml for automated CI/CD

### Build Pipeline
1. GitHub Actions triggers on:
   - Push to main branch (if source.json modified)
   - Manual workflow dispatch
2. Uses vrchat-community/package-list-action for building
3. Deploys to GitHub Pages automatically

## Important Development Notes

### Adding Packages
- **GitHub packages**: Add to `githubRepos` array as "owner/repo"
- **External packages**: Add to `packages` array with name and release URLs

### GitHub Pages Setup
Must be enabled with "GitHub Actions" as the source (not "Deploy from a branch")

### Generated Output
- Creates index.json at the configured URL
- Generates a landing page with package listing UI
- Both are accessible via GitHub Pages after deployment

## Common Tasks

### Update Package Listing
1. Edit source.json to add/remove packages
2. Commit and push to main branch
3. GitHub Actions handles build and deployment

### Customize Landing Page
Edit files in /Website/ directory:
- index.html for structure
- styles.css for styling
- app.js for functionality