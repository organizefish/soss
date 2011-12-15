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

// All insert actions require faculty auth
$auth = soss_auth();
if ($auth < AUTH_FACULTY) {
    soss_send_json_response(SOSS_RESPONSE_PERMISSION_DENIED, "Access Denied.");
}

$target = soss_get_request('t');
$obj = new Soss_Insert();

if ($target == "assignment") {
    $obj->insert_assignment();
} elseif ($target == "class") {
    $obj->insert_class();
} elseif ($target == "student") {
    $obj->insert_student();
} elseif ($target == "bulkstudent") {
    $obj->bulk_insert_student();
} else {
    soss_send_json_response(SOSS_RESPONSE_ERROR, "Unrecognized query.");
}

class Soss_Insert {

    public function bulk_insert_student() {
    	
    	// Make sure the class id is valid
    	try {
	    	$db = SOSS_DB::getInstance();
	    	if( ! $db->isValidClassId() ) {
	    		soss_send_json_response(SOSS_RESPONSE_ERROR, "Invalid class.");
	    	}
    	} catch (SOSS_DB_Exception $e) {
    		soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "SQL Exception: " . $e->getCode() . $e->getMessage());
    	}
    	
        $errors = array();
        $students = array();
        $input = soss_get_request('class_list');
        $line_num = 0;
        $lines = preg_split('/\r?\n/', $input);

        foreach ($lines as $line) {
            $line = trim($line);
            $line_num++;
            if (empty($line))
                continue;

            $fname = "";
            $lname = "";
            $email = "";
            $groups = array();

            // format last, first (email)
            if (preg_match(
                            '/^([^,\(\)]*),([^,\(\)]*)\(\s*([^@\s]+@[^@\s]+)\s*\)$/',
                            $line, $groups)) {
                $lname = trim($groups[1]);
                $fname = trim($groups[2]);
                $email = trim($groups[3]);
            }
            // format last, first, email
            elseif (preg_match(
                            '/^([^,]*),([^,]*),\s*([^@\s]+@[^@\s]+)$/',
                            $line, $groups)) {
                $lname = trim($groups[1]);
                $fname = trim($groups[2]);
                $email = trim($groups[3]);
            }
            // Single email address on a line
            elseif (preg_match('/^[^@\s]+@[^@\s]+$/', $line)) {
                $email = $line;
            } else {
                $errors[] .= "Line $line_num has unrecognized format, skipped.";
            }

            // Add to the list if the line was parsable
            if (!empty($email)) {
                // Check to see if that email already exists
                if (array_key_exists($email, $students)) {
                    $errors[] = "Found duplicate email address: $email, on line $line_num.  Skipped.";
                } else {
                    $students[$email] = array(
                        'lname' => $lname,
                        'fname' => $fname);
                }
            }
        } // end loop over lines

        // Find the accounts in LDAP if necessary
        if( SOSS_USE_LDAP ) {
            $this->findInLdap($students, $errors);
        }

        // Insert the students into the table
        $good_count = 0;
        foreach ($students as $email => $info) {

            try {
                $db = SOSS_DB::getInstance();

                $sql = "INSERT INTO %s(class_id,username,email,lastname,firstname,passwd,grader_priv) VALUES ";
                $sql .= "( '%s', '%s', '%s', '%s', '%s', '%s', 'N' )";

                if( array_key_exists('username', $info) ) {
                    $uname = $info['username'];
                } else {
                    $uname = $email;
                }

                if( SOSS_USE_LDAP ) {
                    $pass = "";
                } else {
                    $pass = sha1(SOSS_DEFAULT_PASS);
                }

                $sql = sprintf($sql, SOSS_DB::$STUDENT_TABLE,
                                $db->dbclean($_SESSION['classid']),
                                $db->dbclean($uname),
                                $db->dbclean($email),
                                $db->dbclean($info['lname']),
                                $db->dbclean($info['fname']),
                                $db->dbclean($pass));

                $result = $db->query($sql);
                $good_count++;
            } catch (SOSS_DB_Exception $e) {

                if ($e->getCode() == 1062) {
                    $errors[] = "A student with username: $uname already exists in this class.";
                } else {
                    soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "SQL Exception: " . $e->getCode() . $e->getMessage());
                }
            }
        }

        $message = "$good_count student(s) added.";
        $data = array( 'errors' => array() );
        if (count($errors) > 0 ) {
            $data['errors'] = $errors;
        }
        soss_send_json_response(SOSS_RESPONSE_SUCCESS, $message, $data);
    }

    private function findUserInLdap( $uname ) {
        $ds = @ldap_connect(SOSS_LDAP_HOST, SOSS_LDAP_PORT);
        if( $ds === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Unable to connect to LDAP server.");
        }
        ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);

        $binddn = SOSS_LDAP_SEARCH_BIND_DN;
        $bindpw = SOSS_LDAP_SEARCH_BIND_PW;
        if( !empty( $binddn) ) {
            $result = @ldap_bind($ds, $binddn, $bindpw);
        } else {
            $result = @ldap_bind($ds);
        }

        if( $result === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Unable to bind to LDAP server: ".ldap_error($ds) );
        }

        $filter = preg_replace('/\%u/', $uname, SOSS_ACCOUNT_FILTER_UNAME);

        $sresult = ldap_search($ds, SOSS_ACCOUNT_SEARCH_BASE, $filter);

        if( $sresult === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                        "LDAP search failed: ". ldap_error($ds));
        }

        $entries = ldap_get_entries($ds, $sresult);
        $nEntries = $entries['count'];
        ldap_close($ds);

        if( $nEntries == 0 ) {
            return false;
        } else {
            return true;
        }

    }

    private function findInLdap( &$email_list, &$errors ) {
        $ds = @ldap_connect(SOSS_LDAP_HOST, SOSS_LDAP_PORT);
        if( $ds === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Unable to connect to LDAP server.");
        }
        ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);

        $binddn = SOSS_LDAP_SEARCH_BIND_DN;
        $bindpw = SOSS_LDAP_SEARCH_BIND_PW;
        if( !empty( $binddn) ) {
            $result = @ldap_bind($ds, $binddn, $bindpw);
        } else {
            $result = @ldap_bind($ds);
        }

        if( $result === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Unable to bind to LDAP server: ".ldap_error($ds) );
        }

        foreach( $email_list as $email => $info ) {

            $filter = preg_replace('/\%e/', $email, SOSS_ACCOUNT_FILTER_EMAIL);

            $sresult = ldap_search($ds, SOSS_ACCOUNT_SEARCH_BASE, $filter);

            if( $sresult === false ) {
                soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "LDAP search failed: ". ldap_error($ds));
            }

            $entries = ldap_get_entries($ds, $sresult);
            if( $entries['count'] == 0 ) {
                $errors[] = "Email: $email, was not found in LDAP.";
                unset($email_list[$email]);
            } elseif( $entries['count'] > 1 ) {
                $errors[] = "Found multiple LDAP accounts for email: $email, please add individually using username.";
                unset($email_list[$email]);
            } else {
                $email_list[$email]['username'] = $entries[0]['uid'][0];
                if( array_key_exists('sn', $entries[0]) )
                    $email_list[$email]['lname'] = $entries[0]['sn'][0];
                if( array_key_exists('givenname', $entries[0]))
                    $email_list[$email]['fname'] = $entries[0]['givenname'][0];
            }
        }

        ldap_close($ds);
    }

    public function insert_student() {
        $data = array(
            'uname' => soss_get_request('uname'),
            'email' => soss_get_request('email'),
            'fname' => soss_get_request('fname'),
            'lname' => soss_get_request('lname')
        );

        try {
            $db = SOSS_DB::getInstance();

            if( ! $db->isValidClassId() ) {
            	soss_send_json_response(SOSS_RESPONSE_ERROR, "Invalid class.");
            }
            if (empty($data['uname'])) {
                soss_send_json_response(SOSS_RESPONSE_ERROR,
                        "Missing required information.");
            } else {

                // First see if the student is already in the table.
                $sql = "SELECT username FROM %s ";
                $sql .= " WHERE username='%s'";
                $sql .= " AND class_id='%s'";

                $sql = sprintf($sql, SOSS_DB::$STUDENT_TABLE,
                                $db->dbclean($data['uname']),
                                $db->dbclean($_SESSION['classid']));
                $result = $db->query($sql);

                if (mysql_num_rows($result) >= 1) {
                    soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Student already exists with that username.");
                } else {

                    if( SOSS_USE_LDAP ) {
                        $result = $this->findUserInLdap($data['uname']);
                        if( $result === false ) {
                            soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Student {$data['uname']} not found in LDAP.");
                        }
                        $pass = "";
                    } else {
                        $pass = sha1(SOSS_DEFAULT_PASS);
                    }

                    $sql = "INSERT INTO %s(class_id, username, email, lastname, firstname,passwd,grader_priv) ";
                    $sql .= "VALUES ('%s', '%s', '%s','%s','%s','%s', 'N')";

                    $sql = sprintf($sql,
                                    SOSS_DB::$STUDENT_TABLE,
                                    $db->dbclean($_SESSION['classid']),
                                    $db->dbclean($data['uname']),
                                    $db->dbclean($data['email']),
                                    $db->dbclean($data['lname']),
                                    $db->dbclean($data['fname']),
                                    $db->dbclean($pass));

                    $result = $db->query($sql);

                    if (mysql_affected_rows() != 1) {
                        soss_send_json_response(SOSS_RESPONSE_ERROR, "Database error.");
                    }
                    soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Student account '{$data['uname']}' added.");
                }
            }
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }
    }

    public function insert_class() {
        $data = array(
            'c_name' => soss_get_request('name'),
            'c_term' => soss_get_request('term'),
            'c_year' => soss_get_request('year')
        );

        if (empty($data['c_name'])) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "You must provide a class name.");
        }

        if (empty($data['c_term'])) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "You must provide a term.");
        }

        if (!(is_numeric($data['c_year']) and $data['c_year'] > 1000
                and $data['c_year'] <= 9999 )) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Invalid year");
        }

        try {
            $db = SOSS_DB::getInstance();

            // Check to see if the class already exists
            $sql = "SELECT * FROM %s WHERE ";
            $sql .="name='%s' AND theyear='%s' AND term='%s' ";

            $sql = sprintf($sql,
                            SOSS_DB::$CLASS_TABLE,
                            $db->dbclean($data['c_name']),
                            $db->dbclean($data['c_year']),
                            $db->dbclean($data['c_term']));

            $db_result = $db->query($sql);
            if (mysql_num_rows($db_result) > 0) {
                soss_send_json_response(SOSS_RESPONSE_ERROR,
                        "That class already exists, please choose another.");
            }
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }

        try {
            $db = SOSS_DB::getInstance();

            // Insert the values into the class table.
            $sql = "INSERT INTO %s VALUES ";
            $sql .="(NULL,'%s','%s', '%s', 'Y')";

            $sql = sprintf($sql,
                            SOSS_DB::$CLASS_TABLE,
                            $db->dbclean($data['c_name']),
                            $db->dbclean($data['c_term']),
                            $db->dbclean($data['c_year']));

            $result = $db->query($sql);

            soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success.",
                    array("id" => mysql_insert_id()));
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }
    }

    public function insert_assignment() {
        $aname = soss_get_request("aname");
        $ddate = soss_get_request("ddate");

        if (empty($aname)) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "You must supply a name for the assignment.");
        }

        if (preg_match('/[\/\\\\]/', $aname)) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Please do not use forward or backward slashes in the assignment name.");
        }

        if (!empty($ddate) && !preg_match('/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/', $ddate)) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Date does not appear to be formatted correctly.");
        }

        try {
            $db = SOSS_DB::getInstance();
            
            if( ! $db->isValidClassId() ) {
            	soss_send_json_response(SOSS_RESPONSE_ERROR, "Invalid class.");
            }

            // Check to see if the assignment name already exists
            $sql = "SELECT name FROM %s ";
            $sql .=" WHERE name='%s' AND class_id=%s";
            $sql = sprintf($sql,
                            SOSS_DB::$ASSIGNMENTS_TABLE,
                            $db->dbclean($aname),
                            $db->dbclean($_SESSION['classid']));

            $result = $db->query($sql);
            if (mysql_num_rows($result) > 0)
                soss_send_json_response(SOSS_RESPONSE_ERROR,
                        "That name already exists.  Please use a different name.");

            // Insert into the database
            $db = SOSS_DB::getInstance();

            $sql = "INSERT INTO %s( class_id, name, due) VALUES ";
            $sql .="(%s,'%s', %s)";

            $due = "NULL";
            if (!empty($ddate))
                $due = "'" . $db->dbclean($ddate) . "'";

            $sql = sprintf($sql,
                            SOSS_DB::$ASSIGNMENTS_TABLE,
                            $db->dbclean($_SESSION['classid']),
                            $db->dbclean($aname), $due);

            $result = $db->query($sql);

            soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Success");
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }
    }
}
