<?php

///////////////////////////////////////
// Global settings
///////////////////////////////////////

// The title displayed at the top of all pages.
define("SOSS_SITE_TITLE", "SOSS File Submission System");

// Possible terms in the school year
$SOSS_TERMS = array( "Fall", "Spring", "J-Term", "Summer" );
// The default password for all new student accounts
define("SOSS_DEFAULT_PASS", "turnin");
// The username for the administrator account
define("SOSS_ADMIN_UNAME", "faculty");
 
////////////////////////////////////////////
// Database settings
////////////////////////////////////////////

// The name of the database used by phpSOSS.
define("SOSS_DB_NAME", "soss_db");
// Hostname of the machine that runs the MySQL server.
define("SOSS_DB_HOST", "localhost");
// The database user 
define("SOSS_DB_USER", "soss_user");
// The password for the database 
define("SOSS_DB_PASSWORD", "hotsoss");

/////////////////////////////////////////////
// File storage settings
/////////////////////////////////////////////

// The command-line zip utility.  This is required for downloading
// multiple files.  It is available on all Linux distributions.
define("SOSS_ZIP", "/usr/bin/zip");

//  Absolute path to the base directory for uploaded file storage.
//  The web server needs rwx permissions on this directory.
define("SOSS_FILE_REPOSITORY", "/var/soss/filestore");

// Umask for uploaded files/directories.  (Don't forget to include a leading zero (0)). 
define("SOSS_UPLOAD_UMASK", 0007);

//////////////////////////////////////
// LDAP Settings
// When LDAP is enabled, student logins are authenticated by
// binding to the LDAP server using a DN that is based on the
// SOSS username (See SOSS_LDAP_ACCOUNT_DN below).  If the LDAP 
// authentication fails, it tries to authenticate the user against 
// the SOSS database.
//////////////////////////////////////

// Whether or not to use LDAP for account authentication
define("SOSS_USE_LDAP", true);
// The LDAP URL (use ldaps: for SSL)
define("SOSS_LDAP_HOST", "ldap://localhost");
// The LDAP port (389 or 636 typically)
define("SOSS_LDAP_PORT", "389");
// The DN used to bind with when authenticating student accounts.  The
// '%u' is replaced with the SOSS username.
define("SOSS_LDAP_ACCOUNT_DN", "uid=%u,ou=People,dc=example,dc=com");
// The LDAP DN to bind with when searching for accounts 
// Leave this blank if your LDAP server allows anonymous searches.
define("SOSS_LDAP_SEARCH_BIND_DN", "" );
// The password for the above DN (if necessary)
define("SOSS_LDAP_SEARCH_BIND_PW", "");

// Filters used when LDAP is used and accounts are being added to a class.
// The system will look for the account in LDAP by searching by email address
// or username.  It searches by email address when you are adding accounts
// "in bulk" and it searches by username when you are adding a single account.
// The system looks for the account and if found, adds it to the class.

// The base of account searches.
define("SOSS_ACCOUNT_SEARCH_BASE", "ou=People,dc=example,dc=com");
// The filter to use when searching for accounts by email. 
//  '%e' is replaced with the email address of the account.
define("SOSS_ACCOUNT_FILTER_EMAIL", "(mail=%e)");
// The filter to use when searching for accounts by username.
//  '%u' is replaced with the username of the account.
define("SOSS_ACCOUNT_FILTER_UNAME", "(uid=%u)");

//ini_set("display_errors", 1);
