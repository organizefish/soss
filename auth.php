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

switch( $target ) {
	case "login":
		$obj->doLogin();
		break;
	case "logout":
		$obj->doLogout();
		break;
	default:
		soss_send_json_response(SOSS_RESPONSE_ERROR, "Unrecognized query.");
}

class Soss_Authenticate {

    public function doLogin() {

        $uname = soss_get_request('uname');
        $class= soss_get_request('class');
        $passwd = soss_get_request('pass', false);

        if (empty($uname) || empty($class) || empty($passwd) || $class < 0) {
            soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Missing required data.");
        }
        
        // Get class details (if available)
        $classInfo = $this->getClassInfo($class);
        
        $result = false;
        
        // If we're authenticating the admin user, do so.
        if( $uname === SOSS_ADMIN_UNAME ) {
        	$result = $this->doAdminLogin();
        	
        	if( $result === true ) {
        		
        		// Set admin session variables
        		$_SESSION['auth'] = AUTH_FACULTY;
        		$_SESSION['uname'] = $uname;
        		
        		if( $classInfo !== false ) {
        			$_SESSION['classid'] = $classInfo['id'];
        			$_SESSION['class_name'] = $classInfo['name'];
        		} else {
        			$_SESSION['classid'] = -1;
        			$_SESSION['class_name'] = "No class selected";
        		}
        		soss_send_json_response(SOSS_RESPONSE_SUCCESS,
        			     "Login succeeded", array("auth" => "admin") );
        	}
        	
        } else {
        	
	        // We're authenticating a student, make sure they've chosen a class
	        if( empty($classInfo) ) {
	        	soss_send_json_response(SOSS_RESPONSE_ERROR,
	        	             "Please select a class.", array("auth" => false));
	        }
	        
	        // Get the student's information
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
	        if( true === $result ) {
	        	// Set authentication type.
	        	if ($stuRow['grader_priv'] == "Y") {
	        		$_SESSION['auth'] = AUTH_GRADER;
	        	} else {
	        		$_SESSION['auth'] = AUTH_STUDENT;
	        	}
	        	
	        	$_SESSION['classid'] = $classInfo['id'];
	        	$_SESSION['class_name'] = $classInfo['name'];
	        	
	        	if( $_SESSION['auth'] == AUTH_GRADER )
	        		soss_send_json_response(SOSS_RESPONSE_SUCCESS,
	                                "Login succeeded", array("auth" => "grader"));
	        	elseif( $_SESSION['auth'] == AUTH_STUDENT )
	        		soss_send_json_response(SOSS_RESPONSE_SUCCESS,
                                	"Login succeeded", array("auth" => "student"));
	        }
        }

       soss_send_json_response(SOSS_RESPONSE_ERROR,
                    "Login failed: The username or password is incorrect.", array("auth" => false));
    }
    
    public function doAdminLogin() {
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
    			$attempt = soss_get_request('pass', false);
    
    			if ($pass != sha1($attempt)) {
    				// Login failed
    				return false;
    			} else {
    				return true;
    			}
    		} else {
    			soss_send_json_response(SOSS_RESPONSE_ERROR,
                            "The admin password has not been set. Please see documentation.");
    		}
    	} catch (SOSS_DB_Exception $e) {
    		soss_send_json_response(SOSS_RESPONSE_ERROR, "DB_Exception: " . $e->getMessage());
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

    private function getClassInfo( $id )
    {
    	try {
    		$db = SOSS_DB::getInstance();
    	
    		$sql = "SELECT name, term, theyear FROM %s ";
    		$sql .="WHERE class_id='%s'";
    	
    		$sql = sprintf($sql,
    			SOSS_DB::$CLASS_TABLE,
    			$db->dbclean($id));
    	
    		$result = $db->query($sql);
    		if( mysql_num_rows($result) > 0 ) {
    			$row = $db->fetch_row($result);
    		} else {
    			return false;
    		}
    		
    		return array(
    			'id' => $id,
    			'name' => $row['name'],
    			'term' => $row['term'],
    			'year' => $row['theyear'],
    			'class_name' => $row['name'] . ", " . $row['term'] . " " . $row['theyear']
    		);
			
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