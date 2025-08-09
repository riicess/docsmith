# DocSmith

![Language](https://img.shields.io/badge/language-JavaScript-brightgreen?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square) ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)

**DocSmith** is a powerful Node.js CLI tool that automatically generates comprehensive README.md files for GitHub repositories by combining GitHub metadata, local project analysis, and AI-generated content. Transform your project documentation from zero to hero with just one command!

## ✨ Features

- **🤖 AI-Powered Content Generation**: Uses Google Gemini AI to create compelling, context-aware README content
- **📊 GitHub Integration**: Automatically fetches repository metadata, stars, license, and topics
- **🔍 Smart Project Analysis**: Intelligently parses project files (`package.json`, `Makefile`, `Dockerfile`, `requirements.txt`, etc.)
- **🏷️ Dynamic Badge Generation**: Creates beautiful Shields.io badges for stars, license, language, and more
- **🔐 Secure API Key Management**: Cross-platform, secure storage of API keys
- **🎯 Dual Mode Operation**: Works with both local repositories and remote GitHub URLs
- **👀 Dry-Run Preview**: Preview generated content before writing to file
- **✅ Safe Overwrite Protection**: Asks for confirmation before overwriting existing README files

## 🔧 Prerequisites

- **Node.js** (version 14.0.0 or higher)
- **Git** (for local repository analysis)
- **Google Gemini API Key** (free at [Google AI Studio](https://makersuite.google.com/app/apikey))

## 📦 Installation

### Install Globally (Recommended)

```bash
npm install -g docsmith
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

## 🚀 Quick Start

### 1. Configure Your API Key (One-time setup)

```bash
docsmith configure
```

This will prompt you to securely enter your Google Gemini API key. The key is stored safely in your system's configuration directory:
- **Linux**: `~/.config/docsmith/config.json`
- **macOS**: `~/Library/Application Support/docsmith/config.json`
- **Windows**: `%APPDATA%\docsmith\config\config.json`

### 2. Generate a README

#### For the Current Directory (Local Repository)

```bash
# Navigate to your project directory
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
# or
docsmith docify --url https://github.com/username/repo --dry-run
```

## 📖 Usage Examples

### Basic Usage

```bash
# Generate README for current directory
docsmith docify

# Generate README for a specific GitHub repository
docsmith docify --url https://github.com/microsoft/vscode

# Preview the output without writing to file
docsmith docify --dry-run
```

### Advanced Examples

```bash
# Analyze a Node.js project
cd my-node-app
docsmith docify

# Analyze a Python project with requirements.txt
cd my-python-project
docsmith docify --dry-run

# Generate README for a public repository you don't have locally
docsmith docify --url https://github.com/facebook/react
```

## 🏗️ How It Works

DocSmith follows a systematic approach to generate comprehensive documentation:

1. **📋 Project Analysis**
   - Detects project type (Node.js, Python, Rust, etc.)
   - Parses configuration files (`package.json`, `requirements.txt`, `Cargo.toml`, etc.)
   - Analyzes build tools (`Makefile`, `Dockerfile`)
   - Extracts available scripts and commands

2. **🐙 GitHub Integration**
   - Fetches repository metadata (stars, forks, license, topics)
   - Retrieves description and language information
   - Handles both public repositories and local Git repositories

3. **🏷️ Badge Generation**
   - Creates dynamic Shields.io badges
   - Includes GitHub stars, license, language, version
   - Adds Docker support badges when applicable

4. **🤖 AI Content Generation**
   - Constructs detailed prompts with all collected data
   - Uses Google Gemini AI for intelligent content generation
   - Generates relevant sections: Features, Installation, Usage, etc.

5. **📝 Final Assembly**
   - Combines badges with AI-generated content
   - Provides safe file writing with overwrite protection
   - Offers dry-run preview functionality

## 🎯 Supported Project Types

DocSmith intelligently detects and handles various project types:

| Technology | Detected Files | Generated Content |
|------------|----------------|-------------------|
| **Node.js** | `package.json` | NPM installation, scripts, dependencies |
| **Python** | `requirements.txt`, `setup.py` | Pip installation, virtual environment setup |
| **Rust** | `Cargo.toml` | Cargo build instructions, crate information |
| **Docker** | `Dockerfile` | Docker build and run instructions |
| **Make** | `Makefile` | Available targets, build instructions |
| **Generic** | Git repository | Basic repository information and badges |

## ⚙️ Configuration

### API Key Management

```bash
# Set up or update your API key
docsmith configure

# The configuration is stored securely at:
# Linux/macOS: ~/.config/docsmith/config.json
# Windows: %APPDATA%\docsmith\config\config.json
```

### Environment Requirements

DocSmith respects your local environment:
- Detects Git repositories automatically
- Works in any directory with proper Git setup
- Handles both SSH and HTTPS Git remotes
- Gracefully handles missing GitHub access

## 🚨 Error Handling

DocSmith provides clear, actionable error messages:

```bash
# If API key is not configured
❌ Error: API key not configured
💡 Tip: Run "docsmith configure" to set up your API key

# If not in a Git repository
❌ Error: Current directory is not a Git repository and no URL was provided
💡 Tip: Initialize a git repository with "git init" or provide a --url parameter

# If repository is not accessible
❌ Error: Repository not found or is private
💡 Tip: Check if the repository URL is correct and publicly accessible
```

## 📁 Project Structure

```
docsmith/
├── src/
│   ├── cli.js          # Main CLI entry point
│   ├── config.js       # API key management
│   ├── github.js       # GitHub API interactions
│   ├── localMeta.js    # Local file analysis
│   ├── badges.js       # Badge generation
│   ├── generate.js     # AI integration and orchestration
│   └── utils.js        # Shared utilities
├── package.json        # Project configuration
└── README.md          # This file
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Add tests**: Ensure your changes work correctly
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes clearly

### Development Setup

```bash
git clone https://github.com/your-username/docsmith.git
cd docsmith
npm install
npm link  # For global testing

# Test your changes
docsmith configure
docsmith docify --dry-run
```

## 📋 Roadmap

- [ ] **OpenAI GPT Integration**: Support for multiple AI providers
- [ ] **Custom Templates**: User-defined README templates
- [ ] **Multi-language Support**: Generate READMEs in different languages
- [ ] **Plugin System**: Extensible architecture for custom analyzers
- [ ] **GitHub Actions Integration**: Automated README updates
- [ ] **Batch Processing**: Process multiple repositories at once

## 🔒 Privacy & Security

- **API keys are stored locally** in OS-specific secure directories
- **No data is transmitted** except to the configured AI service
- **GitHub API calls** use public, read-only endpoints
- **Local file analysis** never executes code, only reads configuration files

## 🐛 Troubleshooting

### Common Issues

**Q: "API key not configured" error**
A: Run `docsmith configure` and enter your Gemini API key

**Q: "Repository not found" error**
A: Ensure the GitHub URL is correct and the repository is public

**Q: "Current directory is not a Git repository" error**
A: Either run `git init` in your project or use the `--url` parameter

**Q: Slow AI response**
A: Large projects may take longer to analyze. The tool includes retry logic for transient errors.

### Getting Help

- 📖 Check this README for detailed instructions
- 🐛 [Open an issue](https://github.com/your-username/docsmith/issues) for bugs
- 💡 [Request a feature](https://github.com/your-username/docsmith/issues) for enhancements
- 📧 Contact the maintainers for support

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful content generation
- **Shields.io** for beautiful badge generation
- **GitHub API** for repository metadata
- **Node.js ecosystem** for excellent tooling

---

**Built with ❤️ by developers, for developers.**

*Transform your project documentation with DocSmith - because great projects deserve great documentation!*
