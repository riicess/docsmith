# DocSmith

DocSmith is a Node.js CLI tool that generates comprehensive README.md files for GitHub repositories by combining GitHub metadata, local project analysis, and AI-generated content.

## Features

- AI-powered content generation using Google Gemini AI
- GitHub integration for repository metadata
- Smart project analysis (package.json, Makefile, Dockerfile, requirements.txt, etc.)
- Dynamic badge generation
- Secure API key management
- Works with both local repositories and remote GitHub URLs
- Dry-run preview before writing
- Safe overwrite protection

## Prerequisites

- Node.js (version 14.0.0 or higher)
- Git (for local repository analysis)
- Google Gemini API Key (free at Google AI Studio)

## Installation

### Install Globally (Recommended)

```bash
npm install -g docsmith
```

### Install Globally from GitHub

```bash
npm install -g git+https://github.com/riicess/docsmith.git
```

### Install Locally

```bash
npm install docsmith
```

### From Source

```bash
git clone https://github.com/your-username/docsmith.git
cd docsmith
npm install
npm link  # Optional: to use globally
```

## Quick Start

### 1. Configure Your API Key

```bash
docsmith configure
```

This will prompt you to securely enter your Google Gemini API key. The key is stored safely in your system's configuration directory:
- Linux: `~/.config/docsmith/config.json`
- macOS: `~/Library/Application Support/docsmith/config.json`
- Windows: `%APPDATA%\docsmith\config\config.json`

### 2. Generate a README

#### For the Current Directory (Local Repository)

```bash
cd /path/to/your/project
docsmith docify
```

#### For a Remote GitHub Repository

```bash
docsmith docify --url https://github.com/username/repository
```

#### Preview Before Writing (Dry Run)

```bash
docsmith docify --dry-run
docsmith docify --url https://github.com/username/repo --dry-run
```

## Usage Examples

```bash
# Generate README for current directory
docsmith docify
# Generate README for a specific GitHub repository
docsmith docify --url https://github.com/microsoft/vscode
# Preview the output without writing to file
docsmith docify --dry-run
```

## Configuration

### API Key Management

```bash
docsmith configure
```

The configuration is stored securely at:
- Linux: ~/.config/docsmith/config.json
- macOS: ~/Library/Application Support/docsmith/config.json
- Windows: %APPDATA%\docsmith\config\config.json

## Troubleshooting

**API key not configured error:**
Run `docsmith configure` and enter your Gemini API key.

**Repository not found error:**
Ensure the GitHub URL is correct and the repository is public.

**Current directory is not a Git repository error:**
Either run `git init` in your project or use the `--url` parameter.

**Slow AI response:**
Large projects may take longer to analyze. The tool includes retry logic for transient errors.

## License

This project is licensed under the MIT License - see the LICENSE file for details