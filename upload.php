<?php
require 'includes/soss_common.php';
require 'soss_db.php';
require 'SOSSFilestore.class.php';
require 'soss_request.php';
require 'soss_json.php';

// Make sure we are authorized to view this data, this page is really
// for students and graders only.
if( ! ($_SESSION['auth'] >= AUTH_STUDENT) ) {
	soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied");
}

////////////////////

function validate_post() {
	//soss_send_json_response(SOSS_RESPONSE_ERROR,"".print_r($_FILES,true). "UPLOAD_ERR_NO_FILE: ".UPLOAD_ERR_NO_FILE);

	if( empty($_FILES['userfile']['name'][0]) or empty($_FILES['userfile']) ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR,
				"No files submitted.");
	}

	$results = array( 'assignment' => soss_get_request('assignment') );

	if ( empty( $results['assignment'] ) or $results['assignment'] == "__none__") {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "Missing assignment.");
	}

	$validCount = 0;

	// Check all file uploads for errors
	for( $i = 0; $i < count($_FILES['userfile']['name']); $i++) {
		if ( $_FILES['userfile']['error'][$i] == UPLOAD_ERR_INI_SIZE or
			$_FILES['userfile']['error'][$i] == UPLOAD_ERR_FORM_SIZE )
		{
			soss_send_json_response(SOSS_RESPONSE_ERROR,
				"UPLOAD FAILED: The file ".$_FILES['userfile']['name'][$i]." is too large.");
		} elseif ( $_FILES['userfile']['error'][$i] == UPLOAD_ERR_PARTIAL ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR, 
				"UPLOAD FAILED: The file ".$_FILES['userfile']['name'][$i]." was only partially uploaded.".
				"Please try again.");
		} elseif ( $_FILES['userfile']['error'][$i] == UPLOAD_ERR_NO_TMP_DIR ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR, 
				"UPLOAD FAILED: Server configuration error: no temporary directory for file uploads.  Contact administrator.");
		} elseif ( $_FILES['userfile']['error'][$i] == UPLOAD_ERR_CANT_WRITE ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR, 
				"UPLOAD FAILED: Server configuration error: unable to write files to disk.	 Contact administrator.");
		} elseif ( $_FILES['userfile']['error'][$i] == UPLOAD_ERR_EXTENSION ) {
			soss_send_json_response(SOSS_RESPONSE_ERROR, 
				"UPLOAD FAILED: Server configuration error: file upload stopped by extension.	Contact administrator.");
		} elseif( $_FILES['userfile']['error'][$i] != UPLOAD_ERR_NO_FILE ) {
			$validCount++;
		}
	}

	if( $validCount == 0 ){
		soss_send_json_response(SOSS_RESPONSE_ERROR, "No files uploaded.");
	} else {
		$results['num_files'] = $validCount;
	}

	return $results;
}

$results = validate_post();

if( $results !== false ) {

	try {
		$db = SOSS_DB::getInstance();

		// Check to see if the user already submitted for this assignment
		$sql = "SELECT id_num FROM %s WHERE ";
		$sql .="student_username='%s' AND ";
		$sql .="student_class_id='%s' AND ";
		$sql .= "assignment_name='%s' AND ";
		$sql .= "assignment_class_id='%s'";
		$sql = sprintf( $sql, SOSS_DB::$FILES_TABLE,
			$db->dbclean($_SESSION['uname']),
			$db->dbclean($_SESSION['classid']),
			$db->dbclean($results['assignment']),
			$db->dbclean($_SESSION['classid']) );
		$dbresult = $db->query($sql);

		$data = array(
			'overwrite' => (mysql_num_rows($dbresult) > 0)
		);

		if( $data['overwrite'] ) {
			$row = $db->fetch_row($dbresult);
		}

		SOSSFilestore::storeUploads( 'userfile', $db, $_SESSION['uname'],
			$results['assignment'], $_SESSION['classid'] );

		// Get the ID for the inserted row
		$data['fileid'] = mysql_insert_id();
		$data['nFiles'] = $results['num_files'];

		if( $results['num_files'] > 1 ) { $tmp = "files"; }
		else { $tmp = "file"; }

		soss_send_json_response(SOSS_RESPONSE_SUCCESS,
			$results['num_files'] . " $tmp uploaded successfully.", $data);

	} catch( SOSS_DB_Exception $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "SQL Exception: " . $e->getMessage() );
	} catch( SOSSFilestoreException $e ) {
		soss_send_json_response(SOSS_RESPONSE_ERROR, "Filestore exception: " .$e->getMessage() );
	}
} else {
	soss_send_json_response(SOSS_RESPONSE_ERROR, "Failed to validate POST data." );
}
