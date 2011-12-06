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

$target = soss_get_request('a');

$obj = new Soss_Authenticate();

if ($target == "login") {
    $obj->doLogin();
} elseif ($target == "logout") {
    $obj->doLogout();
} elseif ($target == "faculty") {
    $obj->doFacultyLogin();
} else {
    soss_send_json_response(SOSS_RESPONSE_ERROR, "Unrecognized query.");
}

class Soss_Authenticate {

    public function doFacultyLogin() {
        try {
            $db = SOSS_DB::getInstance();

            // Get the password from the faculty table.
            $sql = "SELECT passwd FROM %s";
            $sql = sprintf($sql, SOSS_DB::$FACULTY_TABLE);

            $result = $db->query($sql);

            if (mysql_num_rows($result) > 0) {
                $row = $db->fetch_row($result);
                $pass = $row['passwd'];

                // Compare the passwords
                $attempt = soss_get_request('f_pass', false);

                if ($pass != sha1($attempt)) {
                    // Login failed
                    soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "Incorrect password");
                } else {
                    // Successful login, set the session variables
                    $_SESSION['auth'] = AUTH_FACULTY;
                    $_SESSION['classid'] = -1;
                    $_SESSION['class_name'] = "None";

                    soss_send_json_response(SOSS_RESPONSE_SUCCESS, "Login Succeeded");
                }
            } else {
                soss_send_json_response(SOSS_RESPONSE_ERROR,
                        "The faculty password has not been set. Please see documentation.");
            }
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "DB_Exception: " . $e->getMessage());
        }
    }

    public function doLogin() {

        $uname = soss_get_request('uname');
        $class= soss_get_request('class');
        $passwd = soss_get_request('pass', false);

        if (empty($uname) || empty($class) || empty($passwd) || $class < 0) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Missing required data.");
        }

        $stuRow = $this->getStudentRow($uname, $class);

        if( $stuRow !== null ) {
	        // Authenticate using LDAP or database.
	        if( SOSS_USE_LDAP ) {
	            $result = $this->doLoginLdap($uname, $passwd, $class, $stuRow);
	
	            // Fall back to database if LDAP fails.
	            if( ! $result ) {
	                $result = $this->doLoginDb($uname, $passwd, $class, $stuRow);
	            }
	        } else {
	            $result = $this->doLoginDb($uname, $passwd, $class, $stuRow);
	        }
        }

        // If success, set session variables
        if( !empty($result) ) {
            $this->setSession($stuRow);

            // Set authentication type.
            if ($_SESSION['auth'] == AUTH_STUDENT)
                soss_send_json_response(SOSS_RESPONSE_SUCCESS,
                        "Login succeeded", array("auth" => "student"));
            elseif ($_SESSION['auth'] == AUTH_GRADER)
                soss_send_json_response(SOSS_RESPONSE_SUCCESS,
                        "Login succeeded", array("auth" => "grader"));
        } else {
            soss_send_json_response(SOSS_RESPONSE_SUCCESS,
                    "The username or password is incorrect.", array("auth" => false));
        }
    }

    private function doLoginLdap($uname, $pass, $class, $stuRow) {
        
        $ds = @ldap_connect(SOSS_LDAP_HOST, SOSS_LDAP_PORT);
        
        if( $ds === false ) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Unable to connect to LDAP server.");
        }
        ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);
        $dn = preg_replace('/\%u/', $uname, SOSS_LDAP_ACCOUNT_DN);
        $result = @ldap_bind($ds, $dn, $pass);

        ldap_close($ds);

        return $result !== false;
    }

    private function doLoginDb($uname, $pass, $class, $row) {
        // Check password
        return $row['passwd'] == sha1($pass);
    }

    public function doLogout() {
        session_unset();
        session_destroy();

        soss_send_json_response(SOSS_RESPONSE_SUCCESS,
                "Logout successful.");
    }

    private function setSession( $row ) {
        try {
            $db = SOSS_DB::getInstance();

            if ($row['grader_priv'] == "Y") {
                $_SESSION['auth'] = AUTH_GRADER;
            } else {
                $_SESSION['auth'] = AUTH_STUDENT;
            }
            $_SESSION['uname'] = $row['username'];
            $_SESSION['classid'] = $row['class_id'];

            $sql = "SELECT name, term, theyear FROM %s ";
            $sql .="WHERE class_id='%s'";

            $sql = sprintf($sql,
                            SOSS_DB::$CLASS_TABLE,
                            $db->dbclean($_SESSION['classid']));

            $result = $db->query($sql);
            $row = $db->fetch_row($result);
            $class_name = $row['name'];
            $class_name .= ", " . $row['term'] . " " . $row['theyear'];

            $_SESSION['class_name'] = $class_name;
        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }

    }
    
    private function getStudentRow( $uname, $class ) {
        try {
            $db = SOSS_DB::getInstance();

            // Get the matching rows from the student table.
            $sql = "SELECT username, passwd,class_id,grader_priv FROM %s";
            $sql .=" WHERE username='%s' AND class_id='%s'";

            $sql = sprintf($sql,
                            SOSS_DB::$STUDENT_TABLE,
                            $db->dbclean($uname),
                            $db->dbclean($class) );

            $result = $db->query($sql);

            if( mysql_num_rows($result) > 0 ) {
                return mysql_fetch_assoc($result);
            } else {
                return null;
            }

        } catch (SOSS_DB_Exception $e) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "SQL Exception: " . $e->getMessage());
        }
    }

}