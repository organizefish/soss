<?php

require_once 'SOSSDownloader.php';

/*
 * Exception class for errors related to the SOSSFilestore class.
 */

class SOSSFilestoreException extends Exception {

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

class SOSSFilestore {

    /**
     * This function assumes that there were no errors with the upload process.
     * Scripts should check the $_FILES variable for any errors prior to calling
     * this function.  If any errors are found, (other than UPLOAD_ERR_NO_FILE)
     * this will throw a SOSSFilestoreException.
     * 
     * Parameters:
     *    $file_form_name - the name of the file input element in the HTML form
     *    $db - a SOSS_DB instance for database access
     *    
     */
    public static function storeUploads($file_form_name, $db, $uname, $assignment, $classid) {

        $uploads = array();
        foreach( $_FILES[$file_form_name]['error'] as $key => $err ) {
            if ($err === UPLOAD_ERR_OK) {
                if ( get_magic_quotes_gpc() ) {
                    $fname = stripslashes($_FILES[$file_form_name]['name'][$key]);
                } else {
                    $fname = $_FILES[$file_form_name]['name'][$key];
                }
                $uploads[] = array(
                    'name' => $fname,
                    'tmp_name' => $_FILES[$file_form_name]['tmp_name'][$key],
                    'type' => $_FILES[$file_form_name]['type'][$key],
                    'size' => $_FILES[$file_form_name]['size'][$key]
                );
            } else {
                if ($err != UPLOAD_ERR_NO_FILE) {
                    throw new SOSSFilestoreException("Upload failed error: "
                            . $err
                    );
                }
            }
        }

        $num_files = count($uploads);
        if ($num_files < 1) {
            return;
        }

        // The full path to destination file
        $dest_dir = self::getFullPathDirectory($uname, $assignment, $classid);

        // If they have already submitted this assignment,
        // delete the previous submission.
        self::deleteSubmission($uname, $assignment, $classid);

        // Create the directory if it doesn't exist.
        if (!file_exists($dest_dir)) {
            if (self::makeDirectory($dest_dir, SOSS_UPLOAD_UMASK) === false) {
                throw new SOSSFilestoreException("Failed to create directory: $dest_dir");
            }
        }

        // Move the uploaded files into the repo.
        foreach( $uploads as $f ) {
            $dest_file = $dest_dir . DIRECTORY_SEPARATOR . $f['name'];

            $err = move_uploaded_file($f['tmp_name'], $dest_file);

            if (false === $err)
                throw new SOSSFilestoreException(
                        "Error moving uploaded file into repository.");
        }

        // Change the group and permissions on the uploaded files
        if ($dh = opendir($dest_dir)) {
            while (($f = readdir($dh)) !== false) {
                if ($f != "." and $f != "..") {
                    $disk_file = $dest_dir . DIRECTORY_SEPARATOR . $f;
                    chmod($disk_file, 0666 & ~ ( (int) SOSS_UPLOAD_UMASK ));
                }
            }
            closedir($dh);
        }

        // Has the user already submitted for this assignment?
        $sql = "SELECT id_num FROM %s WHERE ";
        $sql .="student_username='%s' AND ";
        $sql .="student_class_id='%s' AND ";
        $sql .= "assignment_name='%s' AND ";
        $sql .= "assignment_class_id='%s'";

        $sql = sprintf($sql, SOSS_DB::$FILES_TABLE,
                        $db->dbclean($uname),
                        $db->dbclean($classid),
                        $db->dbclean($assignment),
                        $db->dbclean($classid));
        $dbresult = $db->query($sql);

        // If we overwrote a previous submission, delete it's record from
        //  the database.
        if (mysql_num_rows($dbresult) > 0) {
            $row = $db->fetch_row($dbresult);

            $sql = "DELETE FROM %s WHERE id_num='%s'";
            $sql = sprintf($sql,
                            SOSS_DB::$FILES_TABLE,
                            $db->dbclean($row['id_num']));
            $result = $db->query($sql);
        }

        // Finally, insert a record for the uploaded submission.
        $submitter_ip = $_SERVER['REMOTE_ADDR'];
        $sql = "INSERT INTO %s (student_class_id, student_username,";
        $sql .=" assignment_class_id, assignment_name, submitted, ip) VALUES";
        $sql .=" ('%s', '%s','%s', '%s', NOW(),'%s')";

        $sql = sprintf($sql, SOSS_DB::$FILES_TABLE,
                        $db->dbclean($classid),
                        $db->dbclean($uname),
                        $db->dbclean($classid),
                        $db->dbclean($assignment),
                        $db->dbclean($submitter_ip));

        $dbresult = $db->query($sql);
    }

    /**
     * Send files to client via standard output.  This function will send the 
     * appropriate headers for a file download, and send all files to the client.
     * The files will be packaged into a zip archive if there are more than one,
     * otherwise, the file itself will be sent.
     *
     * Parameters:
     *  $db - an instance of SOSS_DB
     *  $files - an array of database file (submission) id numbers (or a single id)
     *  $classid - the class id number
     * Throws:
     *    SOSS_DB_Exception on database error
     *    SOSSFilestoreException on filestore error
     */
    public static function sendToClient($db, $files, $classid) {

        if (is_array($files)) {
            $subids = $files;
        } else {
            $subids = array($files);
        }

        if (count($subids) < 1)
            return;

        // Get details on all submissions
        $sql = "SELECT student_username,assignment_name,assignment_class_id " .
                " FROM %s " .
                " WHERE id_num IN (%s)";
        $sql = sprintf($sql,
                        SOSS_DB::$FILES_TABLE,
                        implode($subids, ",")
        );
        $result = $db->query($sql);
        
        // Accumulate some information about all of the requested files.
        $submissions = array( "size" => 0,
            "baseDir" => self::getFullPathClassDirectory($classid),
            "subs" => array());
        while ($row = $db->fetch_row($result)) {
            $uname = $row['student_username'];
            $assign = $row['assignment_name'];
            $cid = $row['assignment_class_id'];

            if ($cid != $classid) {
                throw new SOSSFilestoreException("Submission class id number does " .
                        "not match requested class id number.");
            }

            $sub = array(
                "full_path" => self::getFullPathDirectory($uname, $assign, $cid),
                "size" => 0,
                "fileNames" => self::getSubmissionFileNames($uname, $assign, $cid),
                "relPath" => self::getRelativePathDirectoryUnderClassID($uname, $assign)
            );
            $sub["nFiles"] = count($sub["fileNames"]);
 
            foreach ($sub["fileNames"] as $f) {
                $disk_file = $sub["full_path"] . DIRECTORY_SEPARATOR . $f;

                if (file_exists($disk_file) and is_readable($disk_file)) {
                    $sub["size"] += filesize($disk_file);
                } else {
                    throw new SOSSFilestoreException("Unable to read file: $disk_file.");
                }
            }
            $submissions["subs"][] = $sub;
            $submissions["size"] += $sub["size"];
        }
        
        // Check to see if the user is requesting only a single file.  If so,
        // just send it down the pipe.
        if ( count($submissions["subs"]) == 1 && $submissions["subs"][0]["nFiles"] == 1 ) {
            
            $fName = $submissions["subs"][0]["fileNames"][0];
            $disk_file = $submissions["subs"][0]["full_path"] . DIRECTORY_SEPARATOR .
                         $fName;

            if (file_exists($disk_file) && is_readable($disk_file)) {
                SOSSDownloader::sendFile($disk_file, $fName);
                return;  // We're done.
            } else {
                throw new SOSSFilestoreException("Unable to find file: $disk_file.");
            }
            
        } else {
            // Sending multiple files, so zip them up and then send
            // down to the client.
            SOSSDownloader::zipAndSendSubmissions($submissions);
        }
    }

    private static function deleteSubmission($stu_uname, $assignment, $classid) {

        $dir = self::getFullPathDirectory($stu_uname, $assignment, $classid);

        if (file_exists($dir) and is_dir($dir)) {
            if ($dh = opendir($dir)) {
                while (($file = readdir($dh)) !== false) {
                    if ($file != "." and $file != "..") {
                        $disk_file = $dir . DIRECTORY_SEPARATOR . $file;
                        if (is_file($disk_file)) {
                            if (!unlink($disk_file)) {
                                throw new SOSSFilestoreException("Unable to delete file: $disk_file.");
                            }
                        }
                    }
                }
                closedir($dh);
            } else {
                throw new SOSSFilestoreException("Unable to open directory: $dir");
            }
        }
    }

    public static function getSubmissionFileNames($stu_uname, $assignment, $classid) {

        $dir = self::getFullPathDirectory($stu_uname, $assignment, $classid);

        if (file_exists($dir) and is_dir($dir)) {

            $fileNames = array();

            if ($dh = opendir($dir)) {
                while (($file = readdir($dh)) !== false) {
                    if ($file != "." and $file != "..") {
                        $fileNames[] = $file;
                    }
                }
                closedir($dh);

                return $fileNames;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private static function getFullPathClassDirectory( $classid ) {
        return SOSS_FILE_REPOSITORY . DIRECTORY_SEPARATOR . $classid;
    }
    
    public static function getFullPathFile($fileName, $uname, $assignment, $classid) {
        return self::getFullPathDirectory($uname, $assignment, $classid) .
        DIRECTORY_SEPARATOR . $fileName;
    }

    public static function getFullPathDirectory($stu_uname, $assignment, $classid) {
        return SOSS_FILE_REPOSITORY . DIRECTORY_SEPARATOR .
        self::getRelativePathDirectory($stu_uname, $assignment, $classid);
    }

    public static function getRelativePathDirectory($stu_uname, $assignment, $classid) {
        return $classid . DIRECTORY_SEPARATOR . $assignment .
        DIRECTORY_SEPARATOR . $stu_uname;
    }
    
    private static function getRelativePathDirectoryUnderClassID($stu_uname, $assignment) {
        return $assignment . DIRECTORY_SEPARATOR . $stu_uname;
    }

    /** Creates the provided directory ($path) including
     * all enclosing directories that do not already exist.
     */
    private static function makeDirectory($path, $umask = 0077) {
        if (strlen($path) == 0) {
            return false;
        }
        if (strlen($path) < 2) {
            return true;
        } elseif (is_dir($path)) {
            return true;
        } elseif (dirname($path) == $path) {
            return true;
        }

        if (!self::makeDirectory(dirname($path), $umask))
            return false;

        // This umask trick is apparently not safe on multithreaded web servers
        // according to the php documentation, however, I have not found another
        // way to preserve the sgid bit when safe mode is enabled.  chmod apparently
        // will change the sgid bit to off when safe mode is enabled regardless of
        // whether or not chmod is trying to set it.  Ugh!!
        $old_umask = umask(0);
        if (!mkdir($path, 0777 & ~$umask))
            return false;
        umask($old_umask);

        return true;
    }

}
