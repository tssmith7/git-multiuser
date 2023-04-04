# git-multiuser README

Based on git-autoconfig from shyykoserhiy.  Somewhat the opposite usage from git-autoconfig as this extension is for multiple
users on the same computer (same log-in) to allow different commit user/emails.  The configuration is set globally so it does
not persist with the local repository.  Multiple users share the same repository.

This extension allows easy switching between user.name / user.email pairs that are configured in the --global space of
the git environment.  This is useful in shared computer situations where a single log-in is shared with multiple programmers 
(such as in a school setting).

## Features

* Automatically unsets user.name and user.email on VSCode startup (can be disabled).
* User can select from previously used user.name / user.email combinations.
* Optionally generates noreply email based on user.name

### Menu Items
* Adds a `Git User` submenu to the Source Control ellipsis menu for quick access to commands.

## Extension Settings

This extension adds the following settings:

* `git-multiuser.useNoreplyEmail`: Automatically generate the 'user@users.noreply.github.com' email from the given username.
* `git-multiuser.unsetUserEmailOnStartup`: Clear the user.name and user.email git configs on VSCode startup.
* `git-multiuser.userEmailConfigList`: Saved list of user / email pairs that can be chosen from.

## Release Notes

### 1.0.0 2023-04-04

Initial release of git-multiuser