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

/**
 * Contains functions for sending a file to the client as a download.
 */
class SOSSDownloader {
    
    /**
     * Sends appropriate headers for a download and then sends the contents
     * of the given file to the client.
     * @param string $fileName the full path to the file that is to be sent.
     * @param string $clientFileName the name to present to the client as the
     *        name of the downloaded file. 
     */
    public static function sendFile( $fileName, $clientFileName ) {
        // Output the file to the client
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename='.$clientFileName);
        header('Content-Length: '. filesize($fileName));
        
        readfile($fileName);
    }
    
    /**
     * Zip a set of submissions and send to the client.  This function sends
     * appropriate headers for a download and compresses all of the files found
     * in the submissions into this file.  Uses the zip executable present on the
     * system.  If the zip executable is not available, this function 
     * throws an exception.
     * 
     * @param array $submissions the submission data
     * @param string $clientFileName the filename to present to the client (should
     *        end in .zip).
     * @throws Exception if the zip executable is not available.
     */
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
        else
        {
            throw new Exception("Zip executable not found.  Unable to zip files for download.".
                    "  Please check the SOSS_ZIP setting.");
        }
    }
    
}
