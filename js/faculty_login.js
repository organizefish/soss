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

(function() {
	
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event,
		ERROR_MSG_ID = "error-message",
		SUBMIT_ID = "submit-button",
		LOGIN_FORM_ID = "login-form",
		errorModule = null;
	
	var parseJSON = function( text ) {
		var result = null;
		
		try {
			result = YAHOO.lang.JSON.parse(text);
		} catch (e) {
			alert("Failed to parse JSON, contact administrator: " + 
					text);
		}
		
		// Check for "access denied".   If so, redirect to login.
		if(result.ResponseCode == 110 ) {
			window.open("login.html", "_self");
		}
		
		return result;
	};
	
	var doLogin = function() {
		var checkResponse = function(o) {
			var result = parseJSON(o.responseText);
			if( result.ResponseCode == 200 ) {
				window.open("admin.html", "_self");
			} else {
				errorModule.setBody("Login failed: " + result.Message);
				errorModule.show();
			}
		};
		var callback = {
			success: checkResponse,
			failure: function() { alert("Failed to contact server.");}
		};
		YAHOO.util.Connect.setForm(Dom.get(LOGIN_FORM_ID));
		YAHOO.util.Connect.asyncRequest('POST', 'auth.php?a=faculty', callback);
	};
	
	var validateLogin = function (e) {
		Evt.preventDefault(e);
		doLogin();
	};
	
	var initUI = function() {
		Evt.addListener(Dom.get(LOGIN_FORM_ID),"submit",validateLogin);
		errorModule = new YAHOO.widget.Module(ERROR_MSG_ID,{visible:false});
		errorModule.render();
	};
	
	Evt.onDOMReady(initUI);
})();