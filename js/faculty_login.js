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
				'soss-core': {path: 'soss-core.js', requires: ['event','console','io-base','json-parse','datasource-io', 'datasource-jsonschema']}
			}
		}	
	}
};

YUI(config).use('soss-core', 'io-form', function(Y) {
	Y.log('login.js starting');
	
	var clearErrors = function()
	{
		Y.one('#pass').removeClass('input-error');
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
		Y.io('auth.php?a=faculty', {
			method: 'post',
			form: {
				id: 'login-form'
			},
			on: {
				success: function(id,resp,args) {
					var respCode = resp.parsedResponse.ResponseCode;
					if( respCode == 200 ) {
						window.open("admin.html", "_self");
					} else {
						showError("<p>"+resp.parsedResponse.Message+"</p>");
						Y.one('#login-button').set('disabled', false);
					}
				}
			}
		});
	};
	
	Y.on('soss:ready', function(e) {
		// Login button handler
		Y.one('#login-button').on('click', function(e) {
			e.preventDefault();
			clearErrors();
			Y.one('#login-button').set('disabled', true);
			authenticate();
		});
		
	});
});
