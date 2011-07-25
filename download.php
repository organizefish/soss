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

require 'includes/soss_common.php';
require 'soss_db.php';
require 'redirect.php';
require 'SOSSFilestore.class.php';
require 'soss_request.php';
require 'soss_json.php';

$auth = $_SESSION['auth'];
if( empty($auth) or $auth < AUTH_GRADER ) {
	exit();
}
	
$file_list = soss_get_request('file_list');

if( is_null($file_list) or (is_array($file_list) and count($file_list) == 0) ) { 
	exit();
} else {
	try {
		$db = SOSS_DB::getInstance();
		
		SOSSFilestore::sendToClient($db, $file_list, $_SESSION['classid']);
	} catch ( SOSS_DB_Exception $e ) {
		exit();
	} catch ( SOSSFilestoreException $e ) {
		exit();
	}
	exit();
}
