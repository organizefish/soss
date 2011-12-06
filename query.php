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
require_once 'soss_authentication.php';

$query = soss_get_request('q');

if( empty($query) ) {
	soss_send_json_response(SOSS_RESPONSE_ERROR, "No query selected.");
}

switch( $query )
{
	case "coreInfo":
		sendCoreInfo();
		break;
	case "submissions":
		send_submission_list();
		break;
	case "assignments":
		send_assignments();
		break;
	case "students":
		send_students();
		break;
	case "classes":
		send_classes();
		break;
	case "terms":
		send_terms();
		break;
	default:
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Unrecognized query.");
}

function send_terms() {
	global $SOSS_TERMS;
	soss_send_json_response(SOSS_RESPONSE_SUCCESS,"Success",$SOSS_TERMS);
}

function send_classes() {
	$include_inactive = soss_get_request("includeInactive");
	
	// Must be at least faculty level to see inactive classes
        $auth = soss_auth();

	if( $include_inactive and $auth < AUTH_FACULTY ) {
		soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
	} 
	
	try {
		$db = SOSS_DB::getInstance();
		
		$sql = "SELECT class_id, name, term, theyear AS year, active FROM %s";
		if( ! $include_inactive ) {
			$sql .= " WHERE active='Y'";
		}
		$sql .= " ORDER BY active ASC, year DESC, term ASC";
		
		$sql = sprintf( $sql, SOSS_DB::$CLASS_TABLE );
		
		$result = $db->query($sql);
		
		$list = array();
		if($result) {
			while ($row = $db->fetch_row($result)) {
				$class = array(
					"id" => $row['class_id'],
					"name" => $row['name'],
					"term" => $row['term'],
					"year" => $row['year'],
					"active" => $row['active']
				);
				$list[] = $class;
			}
		}
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $list);
		
	} catch ( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"DB Exception: " . $e->getMessage());
	}
	
}

function send_students() {
	// Must be at least grader level to do this
	$auth = soss_auth();
	if( $auth < AUTH_GRADER ) {
		soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
	}
	
	$classid = $_SESSION['classid'];
	if( $classid < 0 or empty($classid) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "No class ID available.");
	}
	
	$info = array();
	try {
		$db = SOSS_DB::getInstance();
		
		// Get list of students
		$students = array();
		$query = "SELECT username, lastname, firstname, email, grader_priv FROM %s WHERE class_id='%s'";
		
		$query = sprintf( $query ,
			SOSS_DB::$STUDENT_TABLE,
			$db->dbclean($classid) );
		$result = $db->query($query);
		while($row = $db->fetch_row($result) ) {
			$stu = array(
                                "uname" => $row['username'],
				"lname" => $row['lastname'],
				"fname" => $row['firstname'],
				"email" => $row['email'],
				"grader" => $row['grader_priv']
			);
			$students[] = $stu;
		}
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $students);
		
	} catch(SOSS_DB_Exception $e) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"DB Exception: " . $e->getMessage());
	}
}

function send_assignments() {
	
	// Must be at least student level to do this
	$auth = soss_auth();
	if( $auth < AUTH_STUDENT ) {
		soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
	}
	
	$classid = $_SESSION['classid'];
	if( $classid < 0 or empty($classid) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "No class ID available.");
	}
	
	$info = array();
	try {
		$db = SOSS_DB::getInstance();
		
		// Get the list of assignments
		$assignments = array();
		$query = "SELECT name, due";
		$query .= " FROM %s WHERE class_id='%s' ";
		
		$query = sprintf( $query,
			SOSS_DB::$ASSIGNMENTS_TABLE,
			$db->dbclean( $_SESSION['classid'] ) );
	
		$result = $db->query($query);
		while ($row = $db->fetch_row($result))
		{
			$a = array( "name" => $row['name'], "ddate" => $row['due'] );
			$assignments[] = $a;
		}
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $assignments);
		
	} catch(SOSS_DB_Exception $e) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"DB Exception: " . $e->getMessage());
	}
}

// Core information that is available to all users
function sendCoreInfo()
{
	$info = array();
	$info['useLdap'] = SOSS_USE_LDAP;
	$info['version'] = SOSS_VERSION;
	
	// If the client is logged in, pass the relevant session info
	$auth = soss_auth();
	$info['session'] = array();
	$info['session']['authenticated'] = false;
	if( $auth > 0 ) {
		$info['session']['authenticated'] = true;
		if( $auth < AUTH_FACULTY ) {
			$info['session']['uname'] = $_SESSION['uname'];
		} else {
			$info['session']['uname'] = "Faculty";
		}
		$info['session']['className'] = $_SESSION['class_name'];
		$info['session']['classid'] = $_SESSION['classid'];
	}
	
	// Test DB access
	try {
		$db = SOSS_DB::getInstance();
		$info['dbOk'] = true;
	} catch(SOSS_DB_Exception $e) {
		$info['dbOk'] = false;
	}
	
	$info['siteTitle'] = SOSS_SITE_TITLE;
	
	soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $info);
}

function send_submission_list() {
	
	// This query requires at least grader authorization
	$auth = soss_auth();
	if( $auth < AUTH_GRADER ) {
		soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
	}
	
	$classid = $_SESSION['classid'];
	$student = soss_get_request('student');
	$assign = soss_get_request('assignment');
	
	try {
		$db = SOSS_DB::getInstance();
		
		$sql = "SELECT lastname, firstname, id_num, username, submitted, student_username, assignment_name, ip, due ";
		$sql .= "FROM %s F, %s S, %s A ";
		$sql .= "WHERE S.class_id = F.student_class_id AND S.username = F.student_username AND ";
		$sql .= "F.assignment_name=A.name AND F.assignment_class_id=A.class_id AND ";
		$sql .= "F.student_class_id='%s' AND F.assignment_class_id='%s' ";
		
		$sql = sprintf( $sql ,
			SOSS_DB::$FILES_TABLE, 
			SOSS_DB::$STUDENT_TABLE, 
			SOSS_DB::$ASSIGNMENTS_TABLE,
			$db->dbclean($classid),
			$db->dbclean($classid) );
    
		if( !empty($student) ) 
			$sql .= sprintf( "AND F.student_username='%s' ",
				$db->dbclean( $student ) );
		if( !empty($assign) )
			$sql .= sprintf("AND F.assignment_name='%s' ",
				$db->dbclean( $assign ) );
    	$sql .= "ORDER BY student_username, submitted";
		
		$result = $db->query($sql);
	
		$file_data = array();
	
		while ($row = $db->fetch_row($result) )
		{
			$file_info = array();
        
			$file_info['uname'] = trim($row['username']);
			$file_info['sdate'] = $row['submitted'];
			$file_info['aname'] = $row['assignment_name'];
			$file_info['id'] = $row['id_num'];
			$file_info['ip'] = $row['ip'];
			$file_info['name'] = "";
			if( !empty( $row['lastname'] ) ) {
				$file_info['name'] = $row['lastname'];
			}
			if( !empty( $row['firstname'] ) ) {
				$file_info['name'] .=  ", ".$row['firstname'];
			}
			$file_info['ddate'] = $row['due'];
        
			$file_data[] = $file_info;
		}
		
		soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $file_data);
		
	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, 
			"SQL Exception: " . $e->getMessage() );
	}
}
