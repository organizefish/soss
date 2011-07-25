<?php

///////////////////////////////////////
// Global settings
///////////////////////////////////////

// Possible terms in the school year
$SOSS_TERMS = array( "Fall", "Spring", "J-Term", "Summer" );
// The default password for all new student accounts
define("SOSS_DEFAULT_PASS", "turnin");
 
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
define("SOSS_USE_LDAP", false);
// The LDAP URL (use ldaps: for SSL)
define("SOSS_LDAP_HOST", "ldap://localhost");
// The LDAP port (389 or 636 typically)
define("SOSS_LDAP_PORT", "389");
// The DN used to bind with when authenticating student accounts.  The
// '%s' is replaced with the SOSS username.
define("SOSS_LDAP_ACCOUNT_DN", "uid=%s,ou=People,dc=example,dc=com");
// The base DN for LDAP searches
define("SOSS_LDAP_BASEDN", "ou=People,dc=example,dc=com");
// The LDAP DN to bind with when searching for accounts 
// Leave this blank if your LDAP server allows anonymous searches.
define("SOSS_LDAP_SEARCH_BIND_DN", "cn=search user,dc=example,dc=com" );
// The password for the above DN
define("SOSS_LDAP_SEARCH_BIND_PW", "secret");
// The filter to use when searching for accounts.
define("SOSS_ACCOUNT_FILTER", "(employeeType=Student)");

//ini_set("display_errors", 1);
