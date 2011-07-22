(function() {
	
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event;
	
	var CHANGE_PASS_LINK_ID = "change-pass-link",
		CHANGE_PASS_DIALOG_ID = "change-student-pass-dialog",
		LOGOUT_LINK_ID = "logout-link";
	
	var changePassDialog = null;
	
	var changePassHandler = function(e) {
		Evt.preventDefault(e);
		changePassDialog.show();
	};
	
	var initUI = function() {
		var myTabs = new YAHOO.widget.TabView();
		
		myTabs.addTab( new YAHOO.widget.Tab({
		    label: 'Download Files',
		    contentEl: Dom.get("soss-admin-tab-0"),
		    active: true
		}));
		
		myTabs.appendTo("soss-admin-tabs-container");
		
		var handleSubmit = function() { this.submit(); };
		var handleCancel = function() { this.hide(); };
		// Instantiate the Dialog
		changePassDialog = new YAHOO.widget.Dialog(
				CHANGE_PASS_DIALOG_ID, 
					{ width : "30em",
					  fixedcenter : true,
					  visible : false, 
					  modal: true,
					  constraintoviewport : true,
					  draggable: false,
					  buttons : [ { text:"Change", handler:handleSubmit, isDefault:true },
								  { text:"Cancel", handler:handleCancel } ]
					 } );
		changePassDialog.render();
		
		var handleSuccess = function(o) {
			var result = YAHOO.soss.parseJSON(o.responseText);
			if( result.ResponseCode != 200 ) {
				YAHOO.soss.showErrorDialog(result.Message);
			} else {
				YAHOO.soss.showInfoDialog("Password successfully changed.");
			}
		};
		
		var handleFailure = function() {
			YAHOO.soss.showErrorDialog("Unable to change password (server error).");
		};
		
		changePassDialog.callback = { success: handleSuccess,
				failure:handleFailure };
		
		// Validate the entries in the form to require that both first and last name are entered
		changePassDialog.validate = function() {
			var data = this.getData();
			if (data.student_pass_1 != data.student_pass_2) {
				YAHOO.soss.showErrorDialog("Passwords don't match.");
				return false;
			} else {
				return true;
			}
		};
		
		Evt.addListener(CHANGE_PASS_LINK_ID, "click", changePassHandler);
		Evt.addListener(LOGOUT_LINK_ID,"click",signOff);
	};
	
	var signOff = function(e) {
		Evt.preventDefault(e);
		var callback = {
			success: function() {
				window.open("login.html","_self");
			},
			failure: function() { 
				alert("Failed to contact server.");
				window.open("login.html","_self");
			}
		};
		YAHOO.util.Connect.asyncRequest('GET', 'auth.php?a=logout', callback);
	};
	
	Evt.addListener(window, "load", initUI);
})();