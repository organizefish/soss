<?php

/*
 * Exception class for errors related to the SOSS_DB singleton object.
 */

class SOSS_DB_Exception extends Exception {

    // Redefine the exception so message isn't optional
    public function __construct($message, $code = 0) {
        // make sure everything is assigned properly
        parent::__construct($message, $code);
    }

    // custom string representation of object
    public function __toString() {
        return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
    }

}

/**
 * A simple database singleton.
 */
class SOSS_DB {

    public static $ASSIGNMENTS_TABLE = "assignments";
    public static $CLASS_TABLE = "class";
    public static $FACULTY_TABLE = "faculty";
    public static $STUDENT_TABLE = "students";
    public static $FILES_TABLE = "files";
    
    private static $instance;
    private $connection;

    /**
     * Makes a connection to the MySQL server, and selects the database.
     * 
     * @param string $host the hostname of the MySQL server
     * @param string $user the MySQL user name
     * @param string $pass the password
     * @param string $db the database name
     * @throws SOSS_DB_Exception if the connection fails
     */
    private function __construct($host, $user, $pass, $db) {
        $this->connection = @mysql_connect($host, $user, $pass);
        if (!$this->connection) {
            throw new SOSS_DB_Exception(mysql_error(), mysql_errno());
        }
        $this->select_db($db);
    }

    /**
     * Returns the singleton instance of this class.  If a connection to the
     * DB has not already been made, this method initiates a connection.
     * 
     * @return SOSS_DB the singleton database object.
     */
    public static function getInstance() {
        if (!isset(self::$instance)) {
            self::$instance = new SOSS_DB(
                    SOSS_DB_HOST, 
                    SOSS_DB_USER,
                    SOSS_DB_PASSWORD, 
                    SOSS_DB_NAME);
        }
        return self::$instance;
    }

    /**
     * Select the active database.
     * @param string $db_name the database name
     * @throws SOSS_DB_Exception if selection fails
     */
    public function select_db($db_name) {
        if (!@mysql_select_db($db_name)) {
            throw new SOSS_DB_Exception("Unable to select database: " .
                    mysql_error(), mysql_errno());
        }
    }

    /**
     * Cleans $str by escaping special characters (calls mysql_real_escape_string),
     * so that it is safe to place within a query.
     * 
     * @param string $str the string to clean
     * @return string the "clean" version of $str
     */
    public function dbclean($str) {
        return mysql_real_escape_string($str);
    }

    /**
     * Execute a query on the server and returns the result resource (calls
     * mysql_query).
     * 
     * @param string $str the query
     * @return resource the MySQL result resource
     * @throws SOSS_DB_Exception if the query fails 
     */
    public function query($str) {
        $result = @mysql_query($str);
        if (false == $result) {
            throw new SOSS_DB_Exception(mysql_error(), mysql_errno());
        }

        return $result;
    }

    /**
     * Returns the next row from the result resource.
     * 
     * @param resource $resource the MySQL result resource
     * @return array an associative array containing the next row.
     */
    public function fetch_row($resource) {
        if (!is_resource($resource)) {
            throw new SOSS_DB_Exception("Not a valid resource");
        }

        return mysql_fetch_array($resource);
    }

    /**
     * Cloning is not allowed, because this is a singleton.  This function
     * triggers an error.
     */
    public function __clone() {
        trigger_error('Clone is not allowed.', E_USER_ERROR);
    }

}
