// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, Repository, API } from './git';
import * as GMUconfig from './configuration';
import { AssertionError } from 'assert';

const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
if( !gitExtension ) {
	throw AssertionError;
}

const git = gitExtension.exports.getAPI(1);

const MESSAGE_PREFIX = "git-multiuser: ";

let terminal: vscode.Terminal | undefined = undefined;

function runCommand( cmd: string ) {
    if( !terminal || terminal.exitStatus ) {
        terminal = vscode.window.createTerminal( 'git.user' );
    }
    console.log(`${MESSAGE_PREFIX}Running <<${cmd}>>`);
    terminal.sendText( cmd, true );
}

function unsetConfig() {
    runCommand( "git config --global --unset user.name" );
    runCommand( "git config --global --unset user.email" );
    runCommand( "git config --local  --unset user.name" );
    runCommand( "git config --local  --unset user.email" );
	runCommand( "exit" );
}

function getGitRepository() : Repository | undefined {
	if( !vscode.workspace.workspaceFolders ) {
		return undefined;
	}

	const repository = git.getRepository( vscode.workspace.workspaceFolders[0].uri );
	if( !repository ) {
		return undefined;
	}

	return repository;
}

async function setupConfiguration( )  {
	let repo = getGitRepository();
	if( !repo ) {
		return;
	}
		// Check to see if a global user.name and user.email are set.
	const globalUserEmail = await repo.getGlobalConfig('user.email');
	const globalUserName =  await repo.getGlobalConfig('user.name');
	if( globalUserEmail.length > 0 && globalUserName.length > 0 ) {
		let e: GMUconfig.GitMUEntry = { userEmail: globalUserEmail, userName: globalUserName };
		GMUconfig.addToConfigList( e );
	}

		// Check to see if a local user.name and user.email are set.
	const localUserEmail = await repo.getConfig('user.email');
	const localUserName =  await repo.getConfig('user.name');
	if( localUserEmail.length > 0 && localUserName.length > 0 ) {
		let e: GMUconfig.GitMUEntry = { userEmail: localUserEmail, userName: localUserName };
		GMUconfig.addToConfigList( e );
	}
}

async function setGMUConfig( e: GMUconfig.GitMUEntry ) {
	let configcmd = "git config --global ";
	await runCommand( configcmd + 'user.email' + ' ' + e.userEmail );
	await runCommand( configcmd + 'user.name' + ' ' + e.userName );
	await runCommand( "exit" );
}

async function selectGMUConfig( ) {
	let pickList = GMUconfig.getPickList( );
	if( !pickList ) {
		addNewUserEmail();
		return;
	}

	pickList.push( GMUconfig.GIT_MU_NEW_USER_EMAIL );
	const pick = await vscode.window.showQuickPick(pickList, 
									{ ignoreFocusOut: true, 
	  									placeHolder: 'Select a Username or Add a New Entry.',
	  									title: 'GitHub User/Email Selection' });

	console.log(`${MESSAGE_PREFIX} ${JSON.stringify(pick)} selected.`);
	if( pick === GMUconfig.GIT_MU_NEW_USER_EMAIL ) {
	 	await addNewUserEmail();
	} else {
		if( pick ) {
			let cfg = GMUconfig.pickItemToEntry( pick );
			if( cfg ) {
				await setGMUConfig( cfg );
			}
		}
	}
}

async function addNewUserEmail( ) {
	let userName = await vscode.window.showInputBox(
								{ ignoreFocusOut: true, 
									placeHolder: 'user.name', 
									prompt: 'Enter GitHub username.' });
	if( !userName ) {
		vscode.window.showInformationMessage(`Invalid user.name "${userName}"`);
		return;
	}
	let userEmail: string | undefined = undefined;
	if( GMUconfig.getConfigNoreplyEmail() ) {
		userEmail = userName + "@users.noreply.github.com";
	} else {
	 	userEmail = await vscode.window.showInputBox(
							{ ignoreFocusOut: true, 
								placeHolder: 'user@email.com', 
								prompt: 'Enter email that you use for your git account.' });
	}
	if (!userEmail) {
		vscode.window.showInformationMessage(`Invalid user.email "${userEmail}"`);
		return;
	}
	const newConfig: GMUconfig.GitMUEntry = {
		userEmail: userEmail,
		userName: userName
	};

	GMUconfig.addToConfigList( newConfig );
	await setGMUConfig( newConfig );
}

async function deleteGitConfig( ) {
	const pickList = GMUconfig.getPickList();
	if( !pickList ) {
		return;
	}

	const pick = await vscode.window.showQuickPick(pickList, 
									{ ignoreFocusOut: true, 
										canPickMany: true,
										placeHolder: 'Select a config to delete or <Escape> to Exit.',
										title: 'Select User/Email Entries to Delete' });
	if( pick && pick.length ) {
		console.log(`${MESSAGE_PREFIX} Removing ${JSON.stringify(pick)}`);
		GMUconfig.deleteFromConfigList( pick );
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(`${MESSAGE_PREFIX} Extension is now active!`);

	if( !GMUconfig.configurationExists() ) {
		console.log(`${MESSAGE_PREFIX} No configuration exists. Checking git configs...`);
		// No Configuration exists.  Probably the first time this extension has
		// been run.  Try to read any existing user.name/user.email configs and
		// put them in the configuration.
		setupConfiguration();
	}

	if( GMUconfig.getConfigUnsetOnStartup() ) {
		console.log(`${MESSAGE_PREFIX} Unsetting user.name and user.email on startup!`);
		unsetConfig();
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let dispSetGitUser = vscode.commands.registerCommand('git-multiuser.setGitUser', () => {
		// The code you place here will be executed every time your command is executed
		selectGMUConfig();
	});

	let dispDeleteConfig = vscode.commands.registerCommand('git-multiuser.deleteConfig', () => {
		// The code you place here will be executed every time your command is executed
		deleteGitConfig();
	});

	context.subscriptions.push( dispSetGitUser, dispDeleteConfig );
}

// This method is called when your extension is deactivated
export function deactivate() {}
