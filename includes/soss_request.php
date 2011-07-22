<?php

// --------------------------------------------------------------------
// This function returns an item from the $_REQUEST array corresponding
// to the provided key.  If magic quotes is enabled, slashes are
// removed from the data before being returned.  If $trim_val is
// true, white space is also removed from both sides of the data
// before it is returned.  If the item is an array, all elements of
// the array are similarly processed before being returned.
// -------------------------------------------------------------------
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


?>
