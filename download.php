<?php

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
