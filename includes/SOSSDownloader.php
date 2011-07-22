<?php

class SOSSDownloader {
    
    public static function sendFile( $fileName, $clientFileName ) {
        // Output the file to the client
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename='.$clientFileName);
        header('Content-Length: '. filesize($fileName));
        
        readfile($fileName);
    }
    
    public static function zipAndSendSubmissions( &$submissions, $clientFileName = "files.zip" ) {
        chdir( $submissions["baseDir"] );
        
        if(file_exists(SOSS_ZIP) && is_executable(SOSS_ZIP)) {

            $cmd = SOSS_ZIP . " -q -r -";
            foreach( $submissions["subs"] as $sub ) {
                $cmd .= " ". escapeshellarg($sub["relPath"]);
            }

            // Output the file to the client
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename='.$clientFileName);

            passthru($cmd);
        }
    }
    
}
