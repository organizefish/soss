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
require 'soss_request.php';
require 'soss_json.php';

// Only faculty can change class ID
$auth = $_SESSION['auth'];
if( empty($auth) or $auth < AUTH_FACULTY ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
}

$classid = soss_get_request("id");
if(empty($classid)) {
	soss_send_json_response(SOSS_RESPONSE_ERROR, "Missing id.");
}

try {
	$db = SOSS_DB::getInstance();
	
	$query = "SELECT class_id,name,term,theyear FROM %s WHERE class_id='%s'";
	
	$query = sprintf( $query ,
		SOSS_DB::$CLASS_TABLE,
		$db->dbclean($classid) );
	$result = $db->query($query);
	if(mysql_num_rows($result) > 0) {
		$row = $db->fetch_row($result);
		
		$class_name = $row['name'];
		$class_name .= ", ".$row['term']." ".$row['theyear'];
	} else {
		$classid = -1;
		$class_name = "No class selected.";
	}
} catch(SOSS_DB_Exception $e) {
	soss_send_json_response(SOSS_RESPONSE_ERROR, "DB Exception: " . $e->getMessage());
}

$_SESSION['classid'] = $classid;
$_SESSION['class_name'] = $class_name;
soss_send_json_response(SOSS_RESPONSE_SUCCESS,"Success",array('classid' => $classid, 'class_name' => $class_name));
