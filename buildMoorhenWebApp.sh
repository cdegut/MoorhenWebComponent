#!/bin/bash

# Exit on any error
set -e

# Function to print error messages
error_exit() {
    echo "ERROR: $1" >&2
    exit 1
}

# Function to print success messages
success_msg() {
    echo "SUCCESS: $1"
}

echo "Starting Moorhen WebApp build process..."


# Navigate to Moorhen baby-gru directory
cd /home/clement/Moorhen/baby-gru || error_exit "Failed to navigate to /home/clement/Moorhen/baby-gru"
success_msg "Navigated to Moorhen baby-gru directory"

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist || error_exit "Failed to remove dist directory"

# Build release
echo "Building release..."
# npm run build-release || error_exit "Failed to build release"

# echo "Building development version..."
npm run build-webcomponent
# npm run build-release-dev || error_exit "Failed to build release"
success_msg "Development build completed"

# Create package
echo "Creating npm package..."
cd dist || error_exit "Failed to navigate to dist directory"
npm pack || error_exit "Failed to create npm package"
success_msg "npm package created"

# Navigate to MoorhenWrapper directory
cd /home/clement/MoorhenWebComponent


# Clean existing moorhen modules
echo "Cleaning existing moorhen modules..."
rm -rf node_modules/moorhen* package-lock.json || error_exit "Failed to remove existing moorhen modules"
# Find and update package.json with new tgz file
echo "Looking for .tgz file..."
TGZ_FILE=$(ls /home/clement/Moorhen/baby-gru/dist/*.tgz 2>/dev/null | head -1)


if [ -f "$TGZ_FILE" ]; then
    echo "Found .tgz file: $TGZ_FILE"
    sed -i "s|\"moorhen\": \".*\"|\"moorhen\": \"file://$TGZ_FILE\"|" package.json || error_exit "Failed to update package.json"
    echo "Updated package.json with: file://$TGZ_FILE"
    success_msg "package.json updated successfully"
else
    error_exit "No .tgz file found in /home/clement/Moorhen/baby-gru/dist/"
fi

# Install dependencies
echo "Installing dependencies..."
npm install || error_exit "Failed to install npm dependencies"
success_msg "Dependencies installed successfully"

# Copy public files and CSS
#echo "Copying public files and CSS..."
#cp -a node_modules/moorhen/public/* public/ || error_exit "Failed to copy public files"
#cp -r node_modules/moorhen/moorhen.css ./src/ || error_exit "Failed to copy moorhen.css"
#success_msg "Files copied successfully"

# Clean previous build output
echo "Cleaning previous build output..."
rm -rf dist || error_exit "Failed to remove previous build output"

# Build Windows version
echo "Building Moorhen for ccp4 Cloud version..."
npm run build|| error_exit "Failed to build"
success_msg "Moorhen webCompoennt ready"
npm run start