<?php

/*
 * Exception class for errors related to the SOSS_DB singleton object.
 */
class SOSS_DB_Exception extends Exception
{
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


class SOSS_DB 
{
	public static $ASSIGNMENTS_TABLE = "assignments";
	public static $CLASS_TABLE = "class";
    public static $FACULTY_TABLE = "faculty";
    public static $STUDENT_TABLE = "students";
    public static $FILES_TABLE = "files";
	private static $instance;
	private $connection;
	
	private function __construct( $host, $user, $pass, $db )
	{
		$this->connection = @mysql_connect($host, $user, $pass);
		if( ! $this->connection ) {
			throw new SOSS_DB_Exception(mysql_error(), mysql_errno());
		}
		$this->select_db( $db );
	}
	
	public static function getInstance() {
		if( ! isset(self::$instance) ) {
			self::$instance = new SOSS_DB(SOSS_DB_HOST, SOSS_DB_USER, 
				SOSS_DB_PASSWORD, SOSS_DB_NAME);
		}
		return self::$instance;
	}
	
	public function select_db( $db_name ) {
		if( ! @mysql_select_db( $db_name ) ) {
			throw new SOSS_DB_Exception("Unable to select database: " . 
				mysql_error(), mysql_errno());
		}
	}
	
	public function dbclean($str) {
		return mysql_real_escape_string($str);
	}
	
	public function query($str) {
		$result = @mysql_query( $str );
		if( false == $result ) {
			throw new SOSS_DB_Exception(mysql_error(), mysql_errno());
		} 
		
		return $result;
	}
	
	public function fetch_row( $resource ) {
		if( ! is_resource( $resource ) ) {
			throw new SOSS_DB_Exception("Not a valid resource");
		}
		
		return mysql_fetch_array( $resource );
	}
	
	public function __clone() 
	{
		trigger_error('Clone is not allowed.', E_USER_ERROR);
	}
	
}
?>
