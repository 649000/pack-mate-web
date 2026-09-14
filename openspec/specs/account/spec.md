# account Specification

## Purpose
Lets a signed-in user view and manage their profile, security and data from a single account page.

## Requirements

### Requirement: User can manage their profile
The system SHALL let an authenticated user view and edit their display name, birthday and gender. All three fields SHALL be optional.

#### Scenario: Save profile details
- **WHEN** an authenticated user provides a name, birthday or gender and saves
- **THEN** the system stores the values against their account and shows them on the account page

#### Scenario: Clear an optional field
- **WHEN** an authenticated user removes a previously set profile field and saves
- **THEN** the system stores the field as unset

#### Scenario: Profile starts empty
- **WHEN** an authenticated user opens the account page without having set any profile details
- **THEN** the system shows the fields as empty and does not block the page

### Requirement: Profile data is scoped to the authenticated user
The system MUST scope every read and write of profile data to the authenticated user and MUST NOT allow a user to access another user's profile.

#### Scenario: Cross-user profile access is denied
- **WHEN** an authenticated user attempts to read or modify another user's profile
- **THEN** the system denies the operation and returns no data

#### Scenario: Own profile is accessible
- **WHEN** an authenticated user reads their own profile
- **THEN** the system returns their profile

### Requirement: User can change their email
The system SHALL let an authenticated user request an email change, and MUST only apply the change after the new address is verified. The change MUST NOT affect ownership of existing trips, bags, items or packing lists.

#### Scenario: Request an email change
- **WHEN** an authenticated user submits a new email address
- **THEN** the system sends a verification message to the new address and leaves the current email unchanged until verification completes

#### Scenario: Verified email change
- **WHEN** the user completes verification for the new address
- **THEN** the system applies the new email and the user's existing data remains accessible

#### Scenario: Invalid email rejected
- **WHEN** the user submits a value that is not a valid email address
- **THEN** the system rejects the request and shows an error

### Requirement: User can change or set their password
The system SHALL let an authenticated user change their password, and SHALL let a user who has no password set one. The system MUST require re-authentication before the change.

#### Scenario: Change password
- **WHEN** an authenticated user re-authenticates and provides a new password that meets the minimum length
- **THEN** the system updates the password and confirms success

#### Scenario: Set a password for a passwordless account
- **WHEN** an authenticated user who signs in only with a linked provider sets a password
- **THEN** the system links a password credential and the user can sign in with email and password

#### Scenario: Re-authentication required
- **WHEN** a user attempts to change their password without a recent authentication
- **THEN** the system requires re-authentication before applying the change

#### Scenario: Weak password rejected
- **WHEN** the user provides a password shorter than the minimum length
- **THEN** the system rejects it and shows an error

### Requirement: User can manage two-factor authentication
The system SHALL let an authenticated user enroll an authenticator app as a second factor, and SHALL show whether two-factor authentication is enabled. Enrollment and removal MUST require re-authentication.

#### Scenario: Enroll a second factor
- **WHEN** an authenticated user re-authenticates and completes enrollment with a valid code from an authenticator app
- **THEN** the system marks two-factor authentication as enabled for the account

#### Scenario: Invalid enrollment code
- **WHEN** the user submits an invalid code during enrollment
- **THEN** the system does not enable two-factor authentication and shows an error

#### Scenario: Enrollment status shown
- **WHEN** an authenticated user opens the account page
- **THEN** the system shows whether two-factor authentication is enabled

#### Scenario: Remove a second factor
- **WHEN** an authenticated user re-authenticates and removes their enrolled second factor
- **THEN** the system disables two-factor authentication for the account

### Requirement: Verified email is required for two-factor authentication
The system SHALL require a verified email before a user can enroll a second factor, and SHALL offer to send a verification message when the email is unverified.

#### Scenario: Enrollment blocked without verification
- **WHEN** an unverified user attempts to enable two-factor authentication
- **THEN** the system does not start enrollment and explains that the email must be verified first

#### Scenario: Send the verification message from setup
- **WHEN** an unverified user chooses to verify from the two-factor setup
- **THEN** the system sends a verification message

#### Scenario: Enrollment allowed once verified
- **WHEN** a user with a verified email completes enrollment
- **THEN** two-factor authentication is enabled for the account

### Requirement: User can unlink a social sign-in provider
The system SHALL let an authenticated user unlink their Google sign-in, and MUST NOT allow unlinking when it would leave the account without a sign-in method.

#### Scenario: Unlink Google
- **WHEN** an authenticated user who also has a password unlinks Google
- **THEN** the system removes the Google credential and the account remains accessible by password

#### Scenario: Unlink blocked without another sign-in method
- **WHEN** an authenticated user whose only sign-in method is Google attempts to unlink Google
- **THEN** the system prevents the unlink and explains that a password must be set first

#### Scenario: Provider not linked
- **WHEN** a user attempts to unlink a provider that is not linked to their account
- **THEN** the system reports that there is nothing to unlink

### Requirement: User can export their data
The system SHALL let an authenticated user download their data as a single JSON file containing their profile, trips, bags, items and packing-list entries.

#### Scenario: Export data
- **WHEN** an authenticated user requests an export
- **THEN** the system downloads a JSON file containing that user's data

#### Scenario: Export contains only own data
- **WHEN** a user exports their data
- **THEN** the file contains only data owned by that user

#### Scenario: Export with no data
- **WHEN** a user with no trips, bags or items requests an export
- **THEN** the system still produces a valid JSON file containing their profile

### Requirement: User can delete their account
The system SHALL let an authenticated user permanently delete their account and all data they own. Deletion MUST require confirmation, MUST require re-authentication, and MUST remove the user's data before removing the authentication account.

#### Scenario: Delete account
- **WHEN** an authenticated user confirms deletion and re-authenticates
- **THEN** the system permanently removes their trips, bags, items, packing-list entries and profile, then removes the authentication account

#### Scenario: Deletion is confirmed first
- **WHEN** an authenticated user requests deletion without confirming
- **THEN** the system deletes nothing and asks for confirmation

#### Scenario: Data removal precedes account removal
- **WHEN** the user's data cannot be removed
- **THEN** the system does not remove the authentication account and reports the failure

### Requirement: User can reach their account page
The system SHALL provide an account page for authenticated users, reachable from the signed-in navigation, and usable on mobile and desktop.

#### Scenario: Open the account page
- **WHEN** an authenticated user selects the profile entry in the signed-in navigation
- **THEN** the system opens the account page

#### Scenario: Unauthenticated access blocked
- **WHEN** a user without an authenticated session requests the account page
- **THEN** the system denies access

### Requirement: User can link a social sign-in provider
The system SHALL let an authenticated user link Google to their account, and SHALL require re-authentication before linking.

#### Scenario: Link Google
- **WHEN** an authenticated user re-authenticates and links Google
- **THEN** the system adds the Google credential and the user can sign in with Google

#### Scenario: Google already linked
- **WHEN** a user attempts to link Google to an account that already has it linked
- **THEN** the system reports that Google is already linked

#### Scenario: Google credential belongs to another account
- **WHEN** the Google account the user chooses is already linked to a different account
- **THEN** the system does not link it and explains the conflict
