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
 * This function returns an item from the $_REQUEST array corresponding
 * to the provided key.  If magic quotes is enabled, slashes are
 * removed from the data before being returned.  If $trim_val is
 * true, white space is also removed from both sides of the data
 * before it is returned.  If the item is an array, all elements of
 * the array are similarly processed before being returned.
 *
 * @param string $key the key
 * @param boolean $trim_val whether or not to trim spaces surrouding the value 
 * @return string,array the value corresponding to $key or NULL if the $key is not
 *         found.
 */
function soss_get_request( $key, $trim_val = True ) {
    
    if( isset( $_REQUEST[$key] ) ) {
        
        $val = $_REQUEST[$key];
        
        if( is_array( $val ) ) 
        {
            foreach( $val as $k => $v ) 
            {
                if( $trim_val )
                    $val[$k] = trim($v);
                
                if( get_magic_quotes_gpc() ) {
                    $val[$k] = stripslashes( $v );
                }
            }
            
            return $val;
            
        } else {
            
            if( $trim_val )
                $val = trim($val);
            
            if( get_magic_quotes_gpc() ) {
                return stripslashes( $val );
            } else {
                return $val;
            }
        }
        
    } else {
        return NULL;
    }
    
}
