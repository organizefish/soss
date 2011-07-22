<?php
require 'includes/soss_common.php';
require 'soss_db.php';
require 'soss_request.php';
require 'soss_json.php';

// All delete actions require faculty auth
$auth = $_SESSION['auth'];
if( empty($auth) or $auth < AUTH_FACULTY ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
}

$target = soss_get_request('t');

if( $target == "assignment" ) {
	delete_assignment();
} elseif( $target == "class" ) {
	delete_class();
} elseif( $target == "student" ) {
	delete_student();
} else {
	soss_send_json_response(SOSS_RESPONSE_ERROR,"Unrecognized query.");
}

function delete_assignment() {
	try {
		$db = SOSS_DB::getInstance();
		
		$assign = soss_get_request('name');
		
		$sql = "DELETE FROM %s WHERE student_class_id=%s ";
		$sql .= "AND assignment_class_id=%s AND assignment_name='%s'";
		$sql = sprintf( $sql,
			SOSS_DB::$FILES_TABLE,
			$db->dbclean($_SESSION['classid']),
			$db->dbclean($_SESSION['classid']),
			$db->dbclean($assign) );
		$result = $db->query($sql);
		$files = mysql_affected_rows();
		
		$sql = "DELETE FROM %s WHERE class_id=%s ";
		$sql .= " AND name='%s'";
		$sql = sprintf( $sql,
			SOSS_DB::$ASSIGNMENTS_TABLE,
			$db->dbclean($_SESSION['classid']),
			$db->dbclean($assign) );
		$result = $db->query($sql);
		$assignments = mysql_affected_rows();
		
		$message = "Deleted $assignments assignment and $files file entries.";
		$message .= "<br />It is now safe to manually delete all files in the repository";
		$message .= " that are associated with assignment \"{$assign}\".";
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, $message);
		
	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"SQL Exception: " . $e->getMessage() );
	}
}

function delete_student() {
	try {
		$db = SOSS_DB::getInstance();
		
		$uname = soss_get_request('uname');
		
		$sql = "DELETE FROM %s WHERE student_class_id='%s' ";
		$sql .= "AND assignment_class_id='%s' ";
		$sql .= "AND student_username='%s'";
		
		$sql = sprintf( $sql, SOSS_DB::$FILES_TABLE,
			$db->dbclean( $_SESSION['classid'] ),
			$db->dbclean( $_SESSION['classid'] ),
			$db->dbclean( $uname ) );
		
		$result = $db->query($sql);
		$files = mysql_affected_rows();
		
		$sql = "DELETE FROM %s WHERE class_id='%s' ";
		$sql .= " AND username='%s'";
		$sql = sprintf( $sql, SOSS_DB::$STUDENT_TABLE,
			$db->dbclean($_SESSION['classid'] ), 
			$db->dbclean( $uname ) );
		$result = $db->query($sql);
		$students = mysql_affected_rows();
		
		$message = "Deleted $students student and $files file entries.";
		$message .= "<br />It is now safe to manually delete all files in the repository";
		$message .= " that are associated with user \"{$uname}\" in class ID: \"{$_SESSION['classid']}\".";
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, $message);
		
	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"SQL Exception: " . $e->getMessage() );
	}
}

function delete_class() {
	
	try {
		$db = SOSS_DB::getInstance();
		
		$classid = soss_get_request('id');
		
		// Delete files
		$sql = "DELETE FROM %s WHERE student_class_id='%s' ";
		$sql .= "AND assignment_class_id='%s'";
		$sql = sprintf( $sql,
			SOSS_DB::$FILES_TABLE,
			$db->dbclean( $classid ),
			$db->dbclean( $classid ) );
		$result = $db->query($sql);
		$files = mysql_affected_rows();
	
		// Delete assignments
		$sql = "DELETE FROM %s WHERE class_id='%s'";
		$sql = sprintf( $sql, SOSS_DB::$ASSIGNMENTS_TABLE, $db->dbclean($classid) );
		$result = $db->query($sql);
		$assignments = mysql_affected_rows();
		
		// Delete students
		$sql = "DELETE FROM %s WHERE class_id='%s'";
		$sql = sprintf( $sql, SOSS_DB::$STUDENT_TABLE, $db->dbclean($classid) );
		$result = $db->query($sql);
		$students = mysql_affected_rows();
		
		// Delete classes
		$sql = "DELETE FROM %s WHERE class_id='%s'";
		$sql = sprintf( $sql, SOSS_DB::$CLASS_TABLE, $db->dbclean($classid) );
		$result = $db->query($sql);
		$classes = mysql_affected_rows();
	
		// If we've deleted the current class, make sure to remove it from
		// the session variables.
		if( $_SESSION['classid'] == $classid ) {
			$_SESSION['classid'] = -1;
			$_SESSION['class_name'] = "None";
		}
	
		$message = "Deleted $students students, $assignments assignments, and $files file entries.";
		$message .= "<br />It is now safe to manually delete all files in the repository";
		$message .= " under the directory named \"{$classid}\".";
	
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, $message );
		
	}  catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"SQL Exception: " . $e->getMessage() );
	}
}
?>