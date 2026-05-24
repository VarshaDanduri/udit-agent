// In-memory session state for remembering previous messages
const sessionState: Record<string, any> = {};

// Global system prompt string
let systemPrompt = '';

function extractCommandsFromTemplate(template: string): string[] {
    // Naive extraction: look for lines starting with '## '
    const lines = template.split('\n');
    return lines.filter(line => line.startsWith('## ')).map(line => line.replace(/^## +/, '').trim());
  }

function updateSystemPrompt(skills: Record<string, any>, scannedTemplate?: string) {
  let template = scannedTemplate || (skills.readme as string) || '';
  let commands = extractCommandsFromTemplate(template);
  systemPrompt = `# SYSTEM PROMPT\nThis agent can carry out the following documented build/runbook tasks (from the README skill or scanned template):\n\nCommands:\n${commands.map((c: string) => '- ' + c).join('\n')}\n\nTemplate context:\n${template.substring(0, 2000)}\n...`;
}
// Command: Write README template to .agent/TEMPLATE.md only if no TEMPLATE.md exists, prompt for repo(s)
// The following block is moved into activate() so context and skills are defined
    // No global system prompt or .agent template logic
    // Verbose agent info command
    context.subscriptions.push(vscode.commands.registerCommand('udit-agent.showSystemPrompt', async () => {
      vscode.window.showInformationMessage('udit-agent is active! This agent will interactively guide you through repo management, README generation, and skill usage. All actions are confirmed with clear prompts and feedback.');
    }));
// Main extension entry point for udit-agent

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load all skills from the skills directory
function loadSkills(skillsDir: string) {
  const skills: Record<string, any> = {};
  if (!fs.existsSync(skillsDir)) return skills;
  const files = fs.readdirSync(skillsDir);
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.md')) {
      const skillName = path.basename(file, path.extname(file));
      try {
        // For .md skills, just read as text
        if (file.endsWith('.md')) {
          skills[skillName] = fs.readFileSync(path.join(skillsDir, file), 'utf8');
        } else {
          // For .js/.ts, require or import
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          skills[skillName] = require(path.join(skillsDir, file));
        }
      } catch (e) {
        console.error(`Failed to load skill ${file}:`, e);
      }
    }
  }
  return skills;
}

export function activate(context: vscode.ExtensionContext) {
  const skillsDir = path.join(context.extensionPath, 'skills');
  const skills = loadSkills(skillsDir);

  // Scan for an existing template in .agent/TEMPLATE.md or TEMPLATE.md in the repo
  let scannedTemplate = '';
  const agentTemplatePath = path.join(context.extensionPath, '.agent', 'TEMPLATE.md');
  const repoTemplatePath = path.join(context.extensionPath, 'TEMPLATE.md');
  if (fs.existsSync(agentTemplatePath)) {
    scannedTemplate = fs.readFileSync(agentTemplatePath, 'utf8');
  } else if (fs.existsSync(repoTemplatePath)) {
    scannedTemplate = fs.readFileSync(repoTemplatePath, 'utf8');
  }
  updateSystemPrompt(skills, scannedTemplate);
  // Command: Show system prompt (for debugging/agent context)
  context.subscriptions.push(vscode.commands.registerCommand('udit-agent.showSystemPrompt', async () => {
    vscode.window.showInformationMessage(systemPrompt.substring(0, 2000));
  }));

  // Command: Approval prompt before continuing a task
  context.subscriptions.push(vscode.commands.registerCommand('udit-agent.approvalPrompt', async () => {
    const approval = await vscode.window.showInformationMessage('Do you approve continuing this task?', 'Approve', 'Cancel');
    if (approval === 'Approve') {
      vscode.window.showInformationMessage('Task approved and continued.');
      sessionState.lastApproval = true;
    } else {
      vscode.window.showInformationMessage('Task cancelled.');
      sessionState.lastApproval = false;
    }
  }));

  // Register a command for each skill
  for (const skillName of Object.keys(skills)) {
    const commandId = `udit-agent.${skillName}`;
    const handler = () => {
      const skill = skills[skillName];
      if (typeof skill === 'string') {
        vscode.window.showInformationMessage(`Skill: ${skillName}\n${skill.substring(0, 200)}...`);
      } else if (typeof skill === 'object') {
        vscode.window.showInformationMessage(`Skill: ${skillName} loaded.`);
      } else {
        vscode.window.showInformationMessage(`Skill: ${skillName} (unknown type)`);
      }
    };
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler));
  }

  // Special: Environment skill
  if (skills.environment) {
    context.subscriptions.push(vscode.commands.registerCommand('udit-agent.environment', () => {
      vscode.window.showInformationMessage(`Environment: ${JSON.stringify(skills.environment, null, 2)}`);
    }));
  }


  // Interactive README generation using the readme skill (remembers last input in sessionState)
  if (skills.readme) {
    context.subscriptions.push(vscode.commands.registerCommand('udit-agent.interactiveReadme', async () => {
      // Step 1: Ask for project title
      const title = await vscode.window.showInputBox({ prompt: 'Enter the project title for the README:', value: sessionState.lastTitle || '' });
      if (!title) {
        vscode.window.showErrorMessage('README generation cancelled (no title).');
        return;
      }
      sessionState.lastTitle = title;

      // Step 2: Ask for a one-line subtitle
      const subtitle = await vscode.window.showInputBox({ prompt: 'Enter a one-line subtitle/description:', value: sessionState.lastSubtitle || '' });
      if (!subtitle) {
        vscode.window.showErrorMessage('README generation cancelled (no subtitle).');
        return;
      }
      sessionState.lastSubtitle = subtitle;

      // Step 3: Ask for a 2-3 sentence intro
      const intro = await vscode.window.showInputBox({ prompt: 'Enter a 2-3 sentence intro for the README:', value: sessionState.lastIntro || '' });
      if (!intro) {
        vscode.window.showErrorMessage('README generation cancelled (no intro).');
        return;
      }
      sessionState.lastIntro = intro;

      // Step 4: Preview and approval
      const template = skills.readme as string;
      let readmeContent = template
        .replace('# <Title> — <one-line subtitle>', `# ${title} — ${subtitle}`)
        .replace('<2-3 sentence intro: what this doc reproduces, on what host, in what scope>', intro);

      const preview = await vscode.window.showInformationMessage('Preview README content before inserting?', 'Show Preview', 'Cancel');
      if (preview !== 'Show Preview') {
        vscode.window.showInformationMessage('README generation cancelled.');
        return;
      }

      const doc = await vscode.workspace.openTextDocument({ content: readmeContent, language: 'markdown' });
      await vscode.window.showTextDocument(doc, { preview: true });

      const approval = await vscode.window.showInformationMessage('Insert this README into the active editor?', 'Insert', 'Cancel');
      if (approval !== 'Insert') {
        vscode.window.showInformationMessage('README insertion cancelled.');
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor to insert README.');
        return;
      }
      editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, readmeContent);
      });
      vscode.window.showInformationMessage('README inserted.');
      sessionState.lastReadmeContent = readmeContent;
    }));
  }

  // Default info command
  context.subscriptions.push(vscode.commands.registerCommand('udit-agent.openChatInfo', () => {
    vscode.window.showInformationMessage('udit-agent is active! Use the Copilot Chat side view to interact with the agent and available skills.');
  }));
}

export function deactivate() {}
