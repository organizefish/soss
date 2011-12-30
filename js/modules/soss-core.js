
YUI.add('soss-core', function(Y, name) {
	
	// Render the console
//	if( YUI.config.debug ) {
//		new Y.Console({ logSource: Y.Global }).render();
//		Y.one('.yui3-console').setStyle('top', '3em');
//	}
	Y.log("soss.js starting up", "info");
	
	Y.namespace("soss.core");
	Y.namespace("soss.event");
	Y.namespace("soss.formatter");
	
	var GUID = Y.guid();
	
	Y.soss.event.logout = function(e) {
		e.preventDefault();
		Y.io("auth.php?a=logout", {
			on: {
				success: function() {
					window.open("login.html","_self");
				},
				failure: function() { 
					alert("Failed to contact server.");
					window.open("login.html","_self");
				}
			}
		});
	};
	
	Y.soss.formatter.date = function(o) {
		var d = o.value;
		if( d !== null && d !== '' ) {
			var dd = Y.DataType.Date.parse( d.replace(/ /, 'T') );
			return Y.DataType.Date.format(dd, {format: "%m/%d/%Y %I:%M %p"});
		}
		else return '';
	};
	
	// Global IO handlers.  These are intended to take care of stuff that
	// needs to be done on every IO request.
	var globalIO = {
		complete: function(id, response, args){
			try {
				response.parsedResponse = Y.JSON.parse(response.responseText);
				// Permission denied error reverts to login page
				if( response.parsedResponse.ResponseCode == 110 ) {
					window.open('login.html', '_self');
				}
			}catch(e){
				alert("JSON parse exception:  " + Y.dump(e) + Y.dump(response.responseText));
			}
		},
		fail: function(id, resp, args ){
			alert("Oops.. Error contacting server...");
		}
	};
	Y.on("io:complete", globalIO.complete, Y);
	Y.on("io:failure", globalIO.fail, Y);
	
	// Global events for SOSS
	Y.publish('soss:ready', {fireOnce: true});
	
	// Set up data sources
	Y.namespace("soss.dataSource");
	Y.soss.dataSource.assignments = new Y.DataSource.IO({source: "query.php?q=assignments"});
	Y.soss.dataSource.assignments.plug({fn: Y.Plugin.DataSourceJSONSchema, cfg: {
		schema: {
			resultListLocator: 'Data',
			resultFields: ["name", 'ddate']
		}
	}});
	
	// Get core info.
	Y.io("query.php?q=coreInfo", {
		on: {
				success: function(id, resp, args) {
					Y.soss.core = resp.parsedResponse.Data;
					Y.one('title').setContent(Y.soss.core.siteTitle);
					Y.all('.soss-site-title').setContent(Y.soss.core.siteTitle);
					Y.fire( 'soss:ready' );
				}
			}
	});
}, '2.0.0', { requires: ['dump', 'datatype-date-parse','datatype-date-format', 'event','console','io-base','json-parse', 'datasource-io', 'datasource-jsonschema'] } );