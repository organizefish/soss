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
		CLASS_SELECT_ID = "class-select",
		ERROR_MSG_ID = "error-message",
		SUBMIT_ID = "submit-button",
		LOGIN_FORM_ID = "login-form",
		UNAME_INPUT_ID = "uname",
		PASS_INPUT_ID = "pass",
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
				if( false == result.Data.auth ) {
					errorModule.setBody(result.Message);
					errorModule.show();
				} else {
					if(result.Data.auth == "student") {
						window.open("student.html", "_self");
					} else if ( result.Data.auth == "grader") {
						window.open("grader.html", "_self");
					} else {
						errorModule.setBody("Unrecognized server response:" + o.responseText);
						errorModule.show();
					}
				}
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
		YAHOO.util.Connect.asyncRequest('POST', 'auth.php?a=login', callback);
	};
	
	var validateLogin = function (e) {
		Evt.preventDefault(e);
		// Check to see that the user has selected an assignment
		var sel = Dom.get(CLASS_SELECT_ID);
	
		if( sel.selectedIndex == 0) {
			errorModule.setBody("Please choose a class from the list.");
			errorModule.show();
			return;
		}
		
		if( YAHOO.lang.trim(Dom.get(UNAME_INPUT_ID).value) == "" ) {
			errorModule.setBody("Please provide a username.");
			errorModule.show();
			return;
		}

		doLogin();
	};
	
	var updateClassSelect = function() {
		var buildSelect = function(o) {
			var result = parseJSON(o.responseText);
			if( result.ResponseCode == 200 ) {
				var oData = result.Data,
				    select = Dom.get(CLASS_SELECT_ID);
				select.innerHTML = '<option value="__none__">[Select Class]</option>';
				for(i=0 ; i < oData.length ; i++) {
					select.innerHTML += '<option value="' + oData[i].id +
						'">'+ oData[i].name + " -- " +
						oData[i].term + ", " + oData[i].year + '</option>';
				}
			} else {
				errorModule.setBody(result.Message);
				errorModule.show();
			}
		};
		
		var callback = {
				success : buildSelect,
				failure : function() { alert("Failed to retrieve class info.");}
			};
		var query = "query.php?q=classes";
		YAHOO.util.Connect.asyncRequest('GET', query, callback, null);
	};
	
	var initUI = function() {
		updateClassSelect();
		Evt.addListener(Dom.get(LOGIN_FORM_ID),"submit",validateLogin);
		errorModule = new YAHOO.widget.Module(ERROR_MSG_ID,{visible:false});
		errorModule.render();
	};
	
	Evt.onDOMReady(initUI);
})();