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

var config = {
	debug: true,
	groups: {
		soss: {
			base: 'js/modules/',
			modules: {
				soss_core: {path: 'soss-core.js', requires: ['event','console','io-base','json-parse','datasource-io', 'datasource-jsonschema']}
			}
		}	
	}
};

YUI(config).use('soss_core', 'io-form', function(Y) {
	Y.log('login.js starting');
	
	var clearErrors = function()
	{
		Y.one('#uname').removeClass('input-error');
		Y.one('#pass').removeClass('input-error');
		Y.one('#class-select').removeClass('input-error');
		var message = Y.one('#login-message');
		message.setStyle('display', 'none');
		message.removeClass('error');
	};
	
	var showError = function( message )
	{
		var messageNode = Y.one('#login-message');
		messageNode.setContent(message);
		messageNode.addClass('error');
		messageNode.setStyle('display', 'block');
	};
	
	var authenticate = function()
	{	
		Y.io('auth.php?a=login', {
			method: 'post',
			form: {
				id: 'login-form'
			},
			on: {
				success: function(id,resp,args) {
					var data = resp.parsedResponse.Data;
					var respCode = resp.parsedResponse.ResponseCode;
					if( respCode == 200 ) {
						if( false === data.auth ) {
							showError("<p>" + resp.parsedResponse.Message + "</p>");
							Y.one('#login-button').set('disabled', false);
						} else if( data.auth === "student") {
							Y.log("Authenticated student");
							// Go to the student UI
							window.open("student.html", "_self");
						} else if ( data.auth === "grader") {
							Y.log("Authenticated grader");
							// Go to the grader UI
							window.open("grader.html", "_self");
						} 
					} else {
						Y.log("Response code = " + Y.dump(resp));
						showError("<p>Unrecognized server response</p>");
						Y.one('#login-button').set('disabled', false);
					}
				}
			}
		});
	};
	
	Y.on('soss:ready', function(e) {
		Y.log("login.js: recieved soss:ready");
		
		// Populate class list
		Y.io("query.php?q=classes", {
			on: {
					success: function(id, resp, args) {	
						var oData = resp.parsedResponse.Data,
						select = Y.one("#class-select");
						select.setContent('<option value="__none__">[Select Class]</option>');
						for( var i=0 ; i < oData.length ; i++) {
							select.append('<option value="' + oData[i].id +
								'">'+ oData[i].name + " -- " +
								oData[i].term + ", " + oData[i].year + '</option>' );
						}
					}
				}
		});
		
		// Login button handler
		Y.one('#login-button').on('click', function(e) {
			e.preventDefault();
			clearErrors();
			
			// Check to see that the user has selected an assignment
			var sel = Y.one('#class-select');
		
			if( sel.get('selectedIndex') == 0) {
				Y.one('#class-select').addClass('input-error');
				showError("<p>Please select a class from the list.</p>");
				return;
			}
			
			if( Y.Lang.trim(Y.one("#uname").get('value')) === "" ) {
				Y.one('#uname').addClass('input-error');
				Y.one('#pass').addClass('input-error');
				
				showError("<p>Please provide a username and a password.</p>");
				return;
			}
			
			Y.one('#login-button').set('disabled', true);
			authenticate();
		});
		
	});
});