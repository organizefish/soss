<?php
/*
    Copyright (c) 2011 David Wolff

    Permission is hereby granted, free of charge, to any person obtaining a copy of 
    this software and associated documentation files (the "Software"), to deal in 
    the Software without restriction, including without limitation the rights to 
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
    of the Software, and to permit persons to whom the Software is furnished to do 
    so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all 
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
    SOFTWARE.
 */

/****************************************************
 This file should be included by all pages.  Starts a
 session, sets up the include path, and includes 
 the config file. 
 ****************************************************/

// Version
define("SOSS_VERSION", "1.0");

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
