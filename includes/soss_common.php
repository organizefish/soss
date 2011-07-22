<?php

/****************************************************
 This file should be included by all pages.  Starts a
 session, sets up the include path, and includes 
 the config file. 
 ****************************************************/

// Version
define("SOSS_VERSION", "1.0-beta");

// Set the include path
$includes = array();
$includes[] = ini_get('include_path');
$includes[] = "lib";
$includes[] = "includes";

$incl_path = implode(PATH_SEPARATOR, $includes);
ini_set("include_path", $incl_path);

// User config file
require 'config.php';

// Authorization levels
define("AUTH_FACULTY", 999);
define("AUTH_GRADER", 200);
define("AUTH_STUDENT", 100);

// Start the session
session_start();

?>