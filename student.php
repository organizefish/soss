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
require 'SOSSFilestore.class.php';
require 'soss_request.php';
require 'soss_json.php';

define("SOSS_FILE_LIST_LIMIT", 30 );

// Make sure we are authorized to view this data, this page is really
// for students and graders only.
if( ! ($_SESSION['auth'] >= AUTH_STUDENT) ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied");
}

$query = soss_get_request('q');

if( empty($query) ) {
	soss_send_json_response(SOSS_RESPONSE_ERROR, "No query selected.");
}


switch( $query )
{
	case "getSubmissionList":
		send_submission_list();
		break;
	case "getFileNames":
		send_submission_file_names();
		break;
	default:
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Unrecognized query.");
}

//////////////////////////////////////////////////////

function send_submission_file_names() {

	$file_id = soss_get_request('fileid');
	if( empty($file_id) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "No file ID provided.");
	}
	$response = array( "fileid" => $file_id );

	try {
		$db = SOSS_DB::getInstance();

		$sql = "SELECT student_username, assignment_name, assignment_class_id ";
		$sql .= " FROM %s";
		$sql .= " WHERE id_num = '%s'";

		$sql = sprintf( $sql,
			SOSS_DB::$FILES_TABLE,
			$db->dbclean($file_id) );

		$dbresult = $db->query($sql);

		if( mysql_num_rows($dbresult) < 1 ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR, "Submission ID not found in DB.");
		}

		$row = $db->fetch_row($dbresult);

		$uname = $row['student_username'];
		$assign = $row['assignment_name'];
		$classid = $row['assignment_class_id'];

		if( $_SESSION['auth'] == AUTH_STUDENT and $uname != $_SESSION['uname'] ) {
			soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Permission Denied.");
		} else {

			$file_names = SOSSFilestore::getSubmissionFileNames( $uname,
				$assign, $classid );

			if( $file_names === false ) {
				soss_send_json_response(SOSS_RESPONSE_ERROR, "Unable to find any files.");
			}

			if( count($file_names) >= 1 ) {
				$response['file_list'] = $file_names;
				soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success", $response);
			} else {
				$response['error'] = "No files";
				soss_send_json_response(SOSS_RESPONSE_ERROR,"No files found.");
			}
		}


	} catch ( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Database error ".$e->getMessage());
	} catch( SOSSFilestoreException $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,"Filestore error ".$e->getMessage());
	}
}

function send_submission_list() {
	try {
		$db = SOSS_DB::getInstance();

		$file_data = array();
		$sql = "SELECT F.id_num AS id, submitted, assignment_name, due ";
		$sql .= "FROM %s F, %s A ";
		$sql .= "WHERE student_class_id='%s' ";
		$sql .= " AND A.name = F.assignment_name ";
		$sql .= " AND F.assignment_class_id = A.class_id ";
		$sql .= " AND student_username='%s' ";
		$sql .= " ORDER BY submitted DESC";

		$sql = sprintf( $sql,
			SOSS_DB::$FILES_TABLE,
			SOSS_DB::$ASSIGNMENTS_TABLE,
			$_SESSION['classid'],
			$_SESSION['uname'] );

		$result = $db->query($sql);

		$data = array();
		while( $row = $db->fetch_row($result) ) {
			$data[] = array(
				"aname" => $row['assignment_name'],
				"ddate" => $row['due'],
				"rdate" => $row['submitted'],
				"id" => $row['id']
			);
		}

		soss_send_json_response(SOSS_RESPONSE_SUCCESS, "", $data);

	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "Database error: ".$e->getMessage());
	}
}

