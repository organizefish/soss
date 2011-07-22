<?php
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

// Check that the class id is a valid one
try {
	$db = SOSS_DB::getInstance();
	
	$query = "SELECT class_id,name,term,theyear FROM %s WHERE class_id='%s'";
	
	$query = sprintf( $query ,
		SOSS_DB::$CLASS_TABLE,
		$db->dbclean($classid) );
	$result = $db->query($query);
	if(mysql_num_rows($result) == 0) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "Invalid id.");
	}
	$row = $db->fetch_row($result);
	
	$class_name = $row['name'];
	$class_name .= ", ".$row['term']." ".$row['theyear'];
	
} catch(SOSS_DB_Exception $e) {
	soss_send_json_response(SOSS_RESPONSE_ERROR, 
		"DB Exception: " . $e->getMessage());
}

$_SESSION['classid'] = $classid;
$_SESSION['class_name'] = $class_name;
soss_send_json_response(SOSS_RESPONSE_SUCCESS,"Success");
?>