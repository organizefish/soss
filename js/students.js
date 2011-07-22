(function() {
	
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event;
	
	var STUDENTS_TABLE_ID = "soss-admin-students-table",
		NEW_STUDENT_BUTTON_ID = "soss-admin-new-stu-button",
		CLASS_LIST_BUTTON_ID = "soss-admin-enter-class-list-button",
		EMAIL_FIELD_ID = "soss-admin-new-stu-email",
		LNAME_FIELD_ID = "soss-admin-new-stu-lname",
		FNAME_FIELD_ID = "soss-admin-new-stu-fname",
                UNAME_FIELD_ID = "soss-admin-new-stu-uname",
		CLASS_LIST_DIALOG_ID = "multiple-students-dialog",
		CLASS_LIST_TEXTAREA_ID = "class-list-textarea";
	
	var DELETE_CONFIRM_DIALOG_ID = "delete-confirm-dialog-student";
	var deleteConfirmDialog = null;
	var unameToDelete = null;
	
	var showDeleteConfirmDialog = function() {
		var dlg = deleteConfirmDialog;
		var title = "Confirm Delete";
		
		if( ! dlg ) {
			dlg = new YAHOO.widget.SimpleDialog(
				DELETE_CONFIRM_DIALOG_ID,
				{
					width:"30em",
					fixedcenter:true,
					visible:false,
					draggable:false,
					close:false,
					icon:YAHOO.widget.SimpleDialog.ICON_INFO,
					constraintoviewport:true,
					modal:true,
					buttons:[
						{text:"Cancel", handler:function(o){ this.hide(); } , isDefault:true},
						{text:"Delete", handler:function(o){ this.hide(); deleteStudent();} }
						]
				}
			);
			
			dlg.setHeader(title);
			dlg.setBody("Placeholder");
			dlg.render(document.body);
			deleteConfirmDialog = dlg;
		}
		message = "<p>About to delete student with username: " + unameToDelete + ".</p>";
		message += "<p>Are you sure you want to do this?</p>";
		dlg.setHeader(title);
		dlg.setBody(message);
		dlg.cfg.setProperty('icon', YAHOO.widget.SimpleDialog.ICON_WARN);
		dlg.bringToTop();
		dlg.show();
		
	};
	
	var deleteHandler = function(oArgs) {
		var key = this.getColumn(oArgs.target).getKey();
		if( key == "del" ) {
			var rec = this.getRecord(oArgs.target);
			unameToDelete = rec.getData("uname");
			showDeleteConfirmDialog();
		}
	};
	
	var deleteStudent = function() {
		if( ! unameToDelete ) return;
		
		var query = "delete.php?t=student";
		query += "&uname=" + YAHOO.soss.urlencode(unameToDelete);
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					if( result.ResponseCode == 200 ) {
						YAHOO.soss.showInfoDialog(result.Message);
						YAHOO.soss.event.onStudentChange.fire();
						unameToDelete = null;
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { 
					YAHOO.soss.showErrorDialog("Error accessing server."); },
				timeout:10000
	
			}, null );
	};
	
	var graderCheckboxHandler = function(oArgs) {
		var elCheckbox = oArgs.target;
		var record = this.getRecord(elCheckbox);
		var newState = elCheckbox.checked;
		
		// Prevent the change until we are sure the change took place
		// on the server-side.
		Evt.preventDefault(oArgs.event);
		
		var query = "update.php?a=stuGraderStatus";
		query += "&uname=" + YAHOO.soss.urlencode(record.getData("uname"));
		query += "&status=" + YAHOO.soss.urlencode((newState) ? "Y" : "N");
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					
					if( result.ResponseCode == 200 ) {
						elCheckbox.checked = newState;
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { },
				timeout:10000
	
			}, null );
	};
	
	var addStudent = function() {
		var lnameField = Dom.get(LNAME_FIELD_ID);
		var fnameField = Dom.get(FNAME_FIELD_ID);
		var emailField = Dom.get(EMAIL_FIELD_ID);
                var unameField = Dom.get(UNAME_FIELD_ID);
		var email = YAHOO.lang.trim(emailField.value);
		var lname = YAHOO.lang.trim(lnameField.value);
		var fname = YAHOO.lang.trim(fnameField.value);
                var uname = YAHOO.lang.trim(unameField.value);
		
		var query = "insert.php?t=student";
		if( !uname ) {
			YAHOO.soss.showErrorDialog("Please provide a username.");
			return;
		} else {
			query += "&uname=" + YAHOO.soss.urlencode(uname);
		}
                if( email ) query += "&email=" + YAHOO.soss.urlencode(email);
		if( lname ) query += "&lname=" + YAHOO.soss.urlencode(lname);
		if( fname ) query += "&fname=" + YAHOO.soss.urlencode(fname);
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					if( result.ResponseCode == 200 ) {
						emailField.value = "";
						lnameField.value = "";
						fnameField.value = "";
                                                unameField.value = "";
						
						YAHOO.soss.ds.studentsDataSource.flushCache();
						YAHOO.soss.event.onStudentChange.fire();
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { },
				timeout:10000
	
			}, null );
	};
	
	var classListButtonHandler = function() {
		YAHOO.soss.classListDialog.show();
	};
	
	var formatStudentName = function(elCell, oRecord, oColumn, oData) {
		var fname = oRecord.getData('fname');
		var lname = oRecord.getData('lname');
		var name = "";
		if( lname ) name += lname;
		if( fname ) name += ", " + fname;
		elCell.innerHTML = name;
	};
	
	var initUI = function() {
		var addButton = new YAHOO.widget.Button(NEW_STUDENT_BUTTON_ID); 
		addButton.on("click", addStudent );
		
		var classListButton = new YAHOO.widget.Button(CLASS_LIST_BUTTON_ID); 
		classListButton.on("click", classListButtonHandler );
		
		// Build the data table for the student list
		var columnDefs = [
                    {
                        key: 'uname',
                        label: 'Username',
                        sortable: true, resizeable:true
                    },
		                  {
		                	  key:"email", 
		                	  label:'E-Mail',
		                	  sortable:true,
		                	  resizeable:true
		                  },
		                  {
		                	  key:"name", label:"Name (last,first)",
		                	  sortable:true,resizeable:true,
		                	  formatter:formatStudentName
		                  },
		                  {
		                	  key:"grader", label:"Grader",
		                	  sortable:false,resizeable:false,
		                	  formatter:"checkbox"
		                  },
		                  { key:"del", label:"",
		                	  sortable:false,resizeable:false,
		                	  formatter:YAHOO.soss.deleteButtonFormatter,
		                	  className:"delete-row-cell"}
		];
		
		var dt = new YAHOO.widget.DataTable(
				STUDENTS_TABLE_ID,
				columnDefs, YAHOO.soss.ds.studentsDataSource,
				{
					MSG_EMPTY: "No students",
					initialLoad: false
				}
			);
		
		dt.subscribe("checkboxClickEvent", graderCheckboxHandler);
		dt.subscribe("cellClickEvent", deleteHandler);
		
		YAHOO.soss.studentsDataTable = dt;
		
		// Instantiate the Dialog
		YAHOO.soss.classListDialog = new YAHOO.widget.Dialog(
				CLASS_LIST_DIALOG_ID, 
					{ width : "50em",
					  fixedcenter : true,
					  visible : false, 
					  modal: true,
					  constraintoviewport : true,
					  draggable: false,
					  buttons : [ { text:"Submit", handler:function() {this.submit();}, isDefault:true },
								  { text:"Cancel", handler:function() {this.hide();} } ]
					 } );
		
		YAHOO.soss.classListDialog.render();
		
		var handleSuccess = function(o) {
			var result = YAHOO.soss.parseJSON(o.responseText);
			if( result.ResponseCode != 200 ) {
				YAHOO.soss.showErrorDialog(result.Message);
			} else {
				Dom.get(CLASS_LIST_TEXTAREA_ID).value = "";
				YAHOO.soss.showInfoDialog(result.Message);
				YAHOO.soss.event.onStudentChange.fire();
			}
		};
		
		var handleFailure = function() {
			YAHOO.soss.showErrorDialog("Unable to add students, network may be down.");
		};
		
		YAHOO.soss.classListDialog.callback = { success: handleSuccess,
				failure:handleFailure };
	};
	
	var updateStudentsTable = function () {
		var dt = YAHOO.soss.studentsDataTable;
		var callback = {
				success : dt.onDataReturnReplaceRows,
				failure : dt.onDataReturnReplaceRows,
				scope : dt
			};
		dt.getDataSource().sendRequest('',callback);
	};
	
	Evt.onDOMReady(initUI);
	YAHOO.soss.event.onDataReady.subscribe(updateStudentsTable);
	YAHOO.soss.event.onStudentChange.subscribe(updateStudentsTable);
})();