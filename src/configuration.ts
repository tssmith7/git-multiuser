// functions to manipulate the git-mulituser configuration list.

import { workspace } from 'vscode';

const GIT_MU_CONFIG_LIST = "userEmailConfigList";
export const GIT_MU_NEW_USER_EMAIL = "Add New Username/Email";

export interface GitMUEntry {
    userName: string,
    userEmail: string
}

    // Private functions ...
function getWSConfig() {
    return workspace.getConfiguration('git-multiuser');
}

function getConfigList(): GitMUEntry[] | undefined {
    return getWSConfig().get<GitMUEntry[]>(GIT_MU_CONFIG_LIST);
}

function generateGitMUKey(e: GitMUEntry) {
    return `${e.userName} (${e.userEmail})`;
}


    // Exported functions ...
export function getConfigNoreplyEmail() {
    return getWSConfig().get<boolean>('useNoreplyEmail');
}

export function getConfigUnsetOnStartup() {
    return getWSConfig().get<boolean>('unsetUserEmailOnStartup');
}

export function configurationExists() : boolean {
    let cfg = getConfigList();
    if( !cfg ) {
        return false;
    }
	return cfg.length > 0;
}

export function getPickList() : Array<string> | undefined {
    const configList = getConfigList();

    if (configList && configList.length) {
		const pickList: Array<string> = configList.reduce((arr, c) => {
			arr.push( generateGitMUKey(c) );
			return arr;
		}, new Array<string>());

        return pickList;
    }

    return undefined;
}

export function pickItemToEntry( p: string ) : GitMUEntry | undefined {
    const configList = getConfigList();

    if (configList && configList.length) {
		const map: Map<string, GitMUEntry> = configList.reduce((map, c) => {
			map.set(generateGitMUKey(c), c);
			return map;
		}, new Map<string, GitMUEntry>());

        return map.get( p );
    }

    return undefined;
}

export function addToConfigList(e: GitMUEntry) {
    let configList = getConfigList();
//    console.log(`Current ConfigList : ${JSON.stringify(configList, null, 2)}`);

    const newConfigKey = generateGitMUKey(e);
    if( configList ) {
        // Only add if it doesn't already exist.
        if (!configList.find((c) => generateGitMUKey(c) === newConfigKey)) {
            console.log(`Adding ${JSON.stringify(e)} to configList`);
            configList.push( e );
        }
        getWSConfig().update(GIT_MU_CONFIG_LIST, configList, true);
    } else {
        // No Configuration list exists yet.  
        let configList = [ e ];
        console.log(`Creating new configList with ${JSON.stringify(configList)}`);
        getWSConfig().update( GIT_MU_CONFIG_LIST, configList, true);
    }
}

export function deleteFromConfigList( items: string[]) {
    let configList = getConfigList();

    if( !configList ) {
        return;
    }

    for( const item of items ) {
        const idx = configList.findIndex((c) => generateGitMUKey(c) === item);
        if( idx >= 0 ) {
            configList.splice( idx, 1 );
        }
    }

    getWSConfig().update(GIT_MU_CONFIG_LIST, configList, true);
}