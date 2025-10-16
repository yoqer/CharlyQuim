#!/bin/bash

# CorteXIDE Release Script
# This script helps create new releases with proper tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use: v0.1.0, v1.2.3, etc."
        exit 1
    fi
}

# Function to check if tag exists
tag_exists() {
    local tag=$1
    git tag -l | grep -q "^$tag$"
}

# Function to check if working directory is clean
check_clean_working_dir() {
    if ! git diff-index --quiet HEAD --; then
        print_error "Working directory is not clean. Please commit or stash changes."
        exit 1
    fi
}

# Function to update version in files
update_version_files() {
    local version=$1
    local version_number=${version#v}  # Remove 'v' prefix
    
    print_status "Updating version in files..."
    
    # Update package.json files
    if [ -f "cortexide/package.json" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version_number\"/" cortexide/package.json
        rm cortexide/package.json.bak
    fi
    
    if [ -f "cortexide-builder/package.json" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version_number\"/" cortexide-builder/package.json
        rm cortexide-builder/package.json.bak
    fi
    
    if [ -f "cortexide-website/package.json" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version_number\"/" cortexide-website/package.json
        rm cortexide-website/package.json.bak
    fi
    
    print_success "Version updated in package.json files"
}

# Function to create changelog entry
create_changelog_entry() {
    local version=$1
    local date=$(date +"%Y-%m-%d")
    
    print_status "Creating changelog entry..."
    
    # Create or update CHANGELOG.md
    if [ ! -f "CHANGELOG.md" ]; then
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to CorteXIDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

EOF
    fi
    
    # Add new version entry
    sed -i.bak "2i\\
\\
## [$version] - $date\\
\\
### Added\\
- Initial release of CorteXIDE\\
\\
### Changed\\
- Forked from Void IDE with CorteXIDE branding\\
\\
### Fixed\\
- Various compilation issues resolved\\
\\
" CHANGELOG.md
    
    rm CHANGELOG.md.bak
    print_success "Changelog entry created"
}

# Function to commit and tag
commit_and_tag() {
    local version=$1
    
    print_status "Committing changes..."
    git add .
    git commit -m "Release $version

- Update version numbers
- Add changelog entry
- Prepare for release"

    print_status "Creating tag $version..."
    git tag -a "$version" -m "Release $version

This release includes:
- Complete AI IDE functionality
- Multi-platform support
- Privacy-first approach
- Automated build system"

    print_success "Tag $version created"
}

# Function to push changes
push_changes() {
    local version=$1
    
    print_status "Pushing changes to remote..."
    git push origin main
    git push origin "$version"
    
    print_success "Changes pushed to remote"
}

# Function to trigger GitHub Actions
trigger_workflow() {
    local version=$1
    
    print_status "GitHub Actions will automatically:"
    echo "  - Build CorteXIDE for all platforms"
    echo "  - Create GitHub release"
    echo "  - Upload distributable files"
    echo "  - Generate release notes"
    echo ""
    print_success "Release process initiated!"
    echo ""
    echo "Monitor progress at: https://github.com/OpenCortexIDE/cortexide/actions"
    echo "Release will be available at: https://github.com/OpenCortexIDE/cortexide/releases/tag/$version"
}

# Main function
main() {
    echo "🚀 CorteXIDE Release Script"
    echo "=========================="
    echo ""
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check if we're on main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_warning "Not on main branch (currently on: $current_branch)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Get version from user
    if [ -z "$1" ]; then
        echo "Usage: $0 <version>"
        echo "Example: $0 v0.2.0"
        echo ""
        echo "Current version: $(git describe --tags --abbrev=0 2>/dev/null || echo "none")"
        exit 1
    fi
    
    local version=$1
    validate_version "$version"
    
    # Check if tag already exists
    if tag_exists "$version"; then
        print_error "Tag $version already exists"
        exit 1
    fi
    
    # Check working directory
    check_clean_working_dir
    
    echo ""
    print_status "Creating release $version..."
    echo ""
    
    # Update version files
    update_version_files "$version"
    
    # Create changelog entry
    create_changelog_entry "$version"
    
    # Commit and tag
    commit_and_tag "$version"
    
    # Push changes
    push_changes "$version"
    
    # Trigger workflow
    trigger_workflow "$version"
    
    echo ""
    print_success "Release $version created successfully! 🎉"
}

# Run main function with all arguments
main "$@"
