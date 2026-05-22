# udit-agent VS Code Extension

A custom VS Code extension for automating workflows in VS Code via a chatbot side view. This agent provides automation and skills for managing codebases, with only the necessary skills included.

## Features
- Automated README generation for Java and TypeScript projects
- Environment skill for safe, non-personalized configuration
- Git operations and issue management skills
- JSDoc and code documentation helpers

## Usage
1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd udit-agent
   ```
2. Open in VS Code. The extension will activate automatically if loaded as a development extension.
3. Use the Copilot Chat panel (side view) to interact with the agent and automate repo tasks.

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
