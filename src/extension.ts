// Main extension entry point for udit-agent
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('udit-agent.openChatInfo', () => {
    vscode.window.showInformationMessage('udit-agent is active! Use the Copilot Chat side view to interact with the agent and available skills.');
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
