# udit-agent VS Code Extension

A custom VS Code extension for automating workflows in VS Code via a chatbot side view. This agent provides automation and skills for managing codebases, with only the necessary skills included.

## Features
- Automated README generation for Java and TypeScript projects
- Environment skill for safe, non-personalized configuration
- Git operations and issue management skills
- JSDoc and code documentation helpers

## Usage
1. Download the six required extensions for VS Code.
2. Run the chatbot by opening the Copilot Chat panel in VS Code.
3. Use the `@repo-manager` command to interact with the agent and automate repo tasks.

### Available Commands
- `@repo-manager create readmes for repos` — Generate README files for repositories
- `@repo-manager generate template` — Display and generate the template file used by the agent
- `@repo-manager start container` — Start a development container
- `@repo-manager help` — Get help with available commands

## Instructions
udit-agent is a VS Code extension for automating workflows via a chatbot side view in VS Code.

### How to Use
1. Open your project in VS Code.
2. Install udit-agent from the VSIX or Marketplace (if published).
3. Open the Copilot Chat panel (side view) to interact with the agent and use available skills.
4. Skills are auto-loaded from the `skills/` directory. Only necessary skills are included.

### Adding Skills
- Place new skill files in the `skills/` directory following the documented format.
- Do not include personal or sensitive information in any skill or configuration file.

## Development
- Skills are located in the `skills/` directory.
- Main extension entry: `src/extension.ts`
- To add new skills, follow the documented skill format and avoid including personal or sensitive information.

## License
MIT — see LICENSE file.

## Maintainers
No direct support contact. For issues, open a GitHub issue in this repository.

---

Do not include personal credentials or environment secrets in this repository.

## Installation and Usage Guide

### 1. Installing the Extension from a .vsix File
- Open VS Code.
- Go to the Extensions view (`Ctrl+Shift+X`).
- Click the “...” (More Actions) menu in the top-right, then select **Install from VSIX...**
- Select the downloaded `udit-agent-0.0.1.vsix` file.
- Reload VS Code if prompted.

### 2. Invoking the Extension
- Open the Copilot Chat panel (View → Copilot Chat, or search “Copilot Chat” in the Command Palette).
- In the chat input, type `@repo-manager` to activate the repo manager skill.

### 3. Using @repo-manager
You can use commands like:
- `@repo-manager create readmes for repos` — Generate README files for repositories
- `@repo-manager generate template` — Generate and display the template file
- `@repo-manager start container` — Start a development container
- `@repo-manager help` — Get help with available commands

### 4. Template Generation
- The `@repo-manager generate template` command displays the template the agent uses and creates the template file.
- If a custom template file exists in the `.repo-manager` directory of the repository, `@repo-manager` will use that template to create READMEs for repos in the current working directory (cwd).
- To use a custom template, create a `.repo-manager` directory in your project root and place your template file there.

### 5. Starting the Environment and Container
- If your project uses a development container:
  - Make sure you have Docker installed and running.
  - Open the Command Palette (`Ctrl+Shift+P`) and select **Dev Containers: Reopen in Container**.
  - VS Code will build and start the container as defined in your `.devcontainer` folder.
- The agent and skills will work inside the container as in your local environment.
