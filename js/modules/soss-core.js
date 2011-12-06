
YUI.add('soss_core', function(Y, name) {
	
	// Render the console if we are in debug mode
	if( YUI.config.debug ) {
		new Y.Console({ logSource: Y.Global }).render();
	}
	Y.log("soss.js starting up", "info");
	
	Y.namespace("soss.core");
	
	var GUID = Y.guid();
	
	// Global IO handlers.  These are intended to take care of stuff that
	// needs to be done on every IO request.
	var globalIO = {
		success: function(id, response, args){
			try {
				response.parsedResponse = Y.JSON.parse(response.responseText);
			}catch(e){
				alert("JSON parse exception:  "+ response);
			}
		},
		fail: function(id, resp, args ){
			alert("Oops.. Error contacting server...");
		}
	};
	Y.on("io:success", globalIO.success, Y);
	Y.on("io:failure", globalIO.fail, Y);
	
	// Global events for SOSS
	Y.publish('soss:ready', {fireOnce: true});
	
	// Get core info.
	Y.io("query.php?q=coreInfo", {
		on: {
				success: function(id, resp, args) {
					Y.soss.core = resp.parsedResponse.Data;
					Y.fire( 'soss:ready' );
				}
			}
	});
}, '2.0.0', { requires: ['event','console','io-base','json-parse'] } );