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

$action = soss_get_request('a');
$auth = $_SESSION['auth'];

// This action can be done by a student
if( empty($auth) or $auth < AUTH_STUDENT ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
}
if($action == "studentPass") {
	change_student_pass();
}

// All the following update actions require faculty auth
if( empty($auth) or $auth < AUTH_FACULTY ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
}

if( $action == "classActiveStatus" ) {
	change_class_active_status();
} elseif( $action == "stuGraderStatus") {
	change_student_grader_status();
} elseif( $action == "adminPass") {
	change_admin_pass();
} else {
	soss_send_json_response(SOSS_RESPONSE_ERROR,"Unrecognized action.");
}

function change_admin_pass() {
	try {
		$db = SOSS_DB::getInstance();
		
		$sql = "SELECT passwd FROM %s WHERE passwd='%s'";
   
		$old_pass = soss_get_request('old_pass', false);
		$sql = sprintf( $sql ,
			SOSS_DB::$FACULTY_TABLE,
			$db->dbclean(sha1($old_pass)) );
		
		$result = $db->query($sql);
		
		$new_pass_1 = soss_get_request('pass_1', false );
		$new_pass_2 = soss_get_request('pass_2', false );
		
		if( mysql_num_rows($result) != 1 ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR,
				"Incorrect password.");
		} elseif ( $new_pass_1 != $new_pass_2 ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR,
				"New passwords don't match");
		} elseif( $new_pass_1 == $old_pass ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR,
				"New password is the same as the old, password not changed.");
		} else {
			$query = "UPDATE %s SET passwd='%s'";
			
			$query = sprintf( $query,
				SOSS_DB::$FACULTY_TABLE,
				$db->dbclean( sha1($new_pass_1) ) );
			
			$result = $db->query($query);
   
			if( mysql_affected_rows() != 1 ) {
				soss_send_json_response(SOSS_RESPONSE_ERROR,
					"Change password affected ".mysql_affected_rows(). 
					" row(s)!");
			} else {
				// Successful change
				soss_send_json_response(SOSS_RESPONSE_SUCCESS,
					"Password successfully changed.");
			}
		}
	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"SQL exception: " . $e->getMessage() );
	}
}

function change_student_pass() {
	try {
		$err_str = "";
		$db = SOSS_DB::getInstance();
	
		$old_pass = soss_get_request('old_pass', false);
		$query = "SELECT passwd FROM %s WHERE passwd='%s' AND";
		$query .= " username='%s' AND class_id='%s'";
		$query = sprintf( $query,
			SOSS_DB::$STUDENT_TABLE,
			$db->dbclean( sha1($old_pass) ),
			$db->dbclean( $_SESSION['uname'] ),
			$db->dbclean( $_SESSION['classid'] ) );
		$result = $db->query($query);
   
		$new_pass_1 = soss_get_request('student_pass_1', false);
		$new_pass_2 = soss_get_request('student_pass_2', false);
		if( mysql_num_rows($result) != 1 ) {
			$err_str = "Incorrect password, try again.";
		} elseif ( $new_pass_1 != $new_pass_2 ) {
			$err_str = "New passwords don't match, try again.";
		} elseif ( $new_pass_1 == $old_pass ) {
			$err_str = "New password is the same as the old.  Password not changed.";
		} else {
			$query = "UPDATE %s ";
			$query .= " SET passwd='%s'";
			$query .= " WHERE class_id='%s' AND username='%s'";
			$query = sprintf( $query,
				SOSS_DB::$STUDENT_TABLE,
				$db->dbclean( sha1($new_pass_1) ),
				$db->dbclean( $_SESSION['classid'] ),
				$db->dbclean( $_SESSION['uname'] ) );
			
			$result = $db->query($query);
   
			if( mysql_affected_rows() != 1 ) {
				$err_str = "Change password failed.  Contact instructor.";
			} else {
				// Successful change
				soss_send_json_response(SOSS_RESPONSE_SUCCESS,
					"Password successfully changed.");
			}
		}
		soss_send_json_response(SOSS_RESPONSE_ERROR, $err_str);
	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"SQL Exception: " . $e->getMessage() );
	}
}

function change_student_grader_status() {
	$uname = soss_get_request("uname");
	$status = soss_get_request("status");
	if( empty($uname) or empty($status) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Missing required information");
	}
	if( $status == "Y" or $status=="true" or $status == "1" ) {
		$statval = "Y";
	} elseif ( $status == "N" or $status=="false" or $status == "0" ) {
		$statval = "N";
	} else {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"Invalid status.");
	}
	
	try {
		$db = SOSS_DB::getInstance();
		
		// Activate the class
		$sql = "UPDATE %s SET ";
		$sql .="grader_priv = '%s' WHERE class_id = '%s' AND username = '%s'";
		
		$sql = sprintf( $sql, SOSS_DB::$STUDENT_TABLE, 
			$statval,
			$db->dbclean( $_SESSION['classid'] ),
			$db->dbclean($uname) );
		$result = $db->query($sql);
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS,"Success");
		
	}  catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"SQL Exception: " . $e->getMessage() );
	}
}

function change_class_active_status() {
	
	$classid = soss_get_request("id");
	$status = soss_get_request("status");
	
	if( empty($classid) or empty($status) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Missing required information");
	}
	
	if( $status == "Y" or $status=="true" or $status == "1" ) {
		$statval = "Y";
	} elseif ( $status == "N" or $status=="false" or $status == "0" ) {
		$statval = "N";
	} else {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"Invalid status.");
	}
	
	try {
		$db = SOSS_DB::getInstance();
		
		// Activate the class
		$sql = "UPDATE %s SET ";
		$sql .="active = '%s' WHERE class_id = '%s'";
		
		$sql = sprintf( $sql, SOSS_DB::$CLASS_TABLE, 
			$statval,
			$db->dbclean( $classid ) );
		$result = $db->query($sql);
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS,"Success");
		
	}  catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
			"SQL Exception: " . $e->getMessage() );
	}
	
}
