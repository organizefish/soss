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
				soss_core: {path: 'soss-core.js', requires: ['event','console','io-base','json-parse','datasource-io','datasource-jsonschema']}
			}
		}	
	}
};

YUI(config).use('soss_core', 'dump', 'io-form', 'io-upload-iframe', function(Y) {
	
	var refreshFileInputs = function(e) {
		var numFileInputs = Y.one('#num-files-select').get('value');
		
		var fileInputList = Y.one('#file-input-list');
		var fileInputs = fileInputList.all('li');
		
		if( fileInputs.size() > numFileInputs ){
			fileInputs.each( function(node, idx, list) {
				if( idx >= numFileInputs )
					node.remove(true);
			});
		} else {
			for( var i = 0; i < numFileInputs - fileInputs.size(); i++ ) {
				fileInputList.append('<li><input type="file" name="userfile[]" /></li>');
			}
		}
	};
	
	var beginUpload = function(e) {
		e.preventDefault();
		
		if( Y.one('#assignment-select').get('selectedIndex') == 0 ) {
			showUploadError("Please select an assignment.");
			return;
		}
	
		var fileInputs = Y.all('#file-input-list input[type="file"]');
		var atLeastOne = false, classFile = false, backupFile = false;
		fileInputs.each( function( node, idx, list ) {
			var fName = Y.Lang.trim(node.get('value'));
			if( fName !== "" ) atLeastOne = true;
			if( fName.match(/\.class$/) ) classFile = true;
			if( fName.match(/~$/) ) backupFile = true;
		});
	
	    if( classFile ) { Y.log("Submitting class file hook"); return; }
	    if( backupFile ) { Y.log("Submitting backup file hook"); return; }
	    if( !atLeastOne ) { showUploadError("Please provide at least one file to upload.");	return; }
	    
		doUpload();
	};
	
	var showUploadError = function( message ) 
	{
		var messageNode = Y.one('#upload-message');
		messageNode.addClass('error');
		messageNode.setContent(message);
	};
	
	var doUpload = function()
	{
		var cfg = {
			method: 'POST',
			form: {
				id: 'upload-form',
				upload: true
			},
			on: {
				start: function(id, args) {
					Y.one('#upload-button').set('disabled', true);
					var messageNode = Y.one('#upload-message');
					messageNode.removeClass('error');
					messageNode.addClass('upload-spinner');
					messageNode.setContent('Uploading... ');
					messageNode.setStyle('display', 'inline');
				},
				complete: function(id, resp, args) {
					Y.one('#upload-button').set('disabled', false);
					var messageNode = Y.one('#upload-message');
					messageNode.removeClass('upload-spinner');
					var mess = resp.parsedResponse.Message;
					if( resp.parsedResponse.ResponseCode == 200 ) {
						if( resp.parsedResponse.Data.overwrite ) 
							mess += " (Previous submission overwritten.)";
						Y.one('#upload-form').reset();
					} else {
						messageNode.addClass('error');
					}
					messageNode.setContent( mess );
				},
				end: function(id, args) { }
			}
		};
		Y.io('upload.php', cfg);
	};
	
	Y.on("soss:ready", function(e) {
		// Populate assignment list
		Y.soss.dataSource.assignments.sendRequest({
			callback: {
				success: function(e) {
					var sel = Y.one('#assignment-select');
					sel.setContent( '<option value="__none__">[Select Assignment]</option>' );
					for( var i=0 ; i < e.response.results.length ; i++) {
						sel.append('<option>'+ e.response.results[i].name+ '</option>');
					}
				},
				failure: function(e) {
					Y.log("Error: " + e.error.message);
				}
			}
		});
		
		// Add options for file count
		var sel = Y.one("#num-files-select");
		sel.setContent("<option>1</option>");
		for( var i = 2; i <=10 ;i++ ){
			sel.append("<option>" + i + "</option>");
		}
		refreshFileInputs();
		sel.on('change', refreshFileInputs);
		
		// Place the upload size limits
		Y.one('#max-file-size').setContent(Y.soss.core.uploadMaxFileSize);
		Y.one('#max-post-size').setContent(Y.soss.core.postMaxSize);
		Y.one('#max-file-size-hidden').set('value', Y.soss.core.uploadMaxFileSizeBytes);
		
		Y.one('#upload-button').on('click', beginUpload);
	});
});

/*
(function() {
	
	var Dom = YAHOO.util.Dom,
	    Evt = YAHOO.util.Event;
	
	var ASSIGNMENT_SELECT_ID = "assignment_select",
		UPLOAD_FORM_ID = "upload_form",
		NUM_FILES_SELECT_ID = "num_files_select",
		MAX_FILE_SIZE_HIDDEN_ID = "max-file-size-hidden",
		MAX_FILE_SIZE_SPAN_ID = "max-file-size",
		MAX_POST_SIZE_SPAN_ID = "max-post-size",
		CHANGE_PASS_DIALOG_ID = "change-student-pass-dialog",
		CHANGE_PASS_LINK_ID = "change-pass-link",
		LOGOUT_LINK_ID = "logout-link";
	
	var changePassDialog = null;
	
	var changePassHandler = function(e) {
		Evt.preventDefault(e);
		changePassDialog.show();
	};
	
	var updateAssignmentSelect = function() {
		var buildSelect = function(oRequest,oParsedResp,oPayload) {
			var oData= oParsedResp.results;
			var el = Dom.get(ASSIGNMENT_SELECT_ID);
			el.innerHTML = '<option value="__none__">[Select Assignment]</option>';
			for(i=0 ; i < oData.length ; i++) {
				el.innerHTML += '<option value="' + oData[i].name +
					'">'+ oData[i].name+ '</option>';
			}
		};
		
		// Sends a request to the DataSource for data
		var oCallback = {
		    success : buildSelect,
		    failure : function() {alert("Failed to retrieve assignment list.");}
		};
		YAHOO.soss.ds.assignmentsDataSource.sendRequest("", oCallback);
	};
	
	var uploadHandler = function(e,form) {
		// Prevent default submission, we'll do it ourselves
		YAHOO.util.Event.preventDefault(e);
	
		// Check to see that the user has selected an assignment
		var sel = Dom.get(ASSIGNMENT_SELECT_ID);
	
		if( sel.options[sel.selectedIndex].value == "__none__" ) {
			YAHOO.soss.showErrorDialog("<p>Please select an assignment from the list.</p>",
					"Missing Assignment");
			return;
		}
	
		// Check to see if the user is submitting a ".class" file, and
		// if there are any files at all.
	    var fileInputs = YAHOO.soss.fileInputModules;
	    var submittingClassFile = false;
	    var atLeastOneFile = false;
	
	    for( i = 0; i < fileInputs.length; i++ ) {
	        var f = fileInputs[i];
	
			var el = Dom.getFirstChild(f.body);
	        if( el.type == "file" ) {
	        	var fName = YAHOO.lang.trim(el.value);
	            if( fName.match(/\.class$/) ) {
	                submittingClassFile = true;
	            }
	            if( fName.length > 0 ) {
	            	atLeastOneFile = true;
	            }
	        }
	    }
	
	    if( submittingClassFile ) {
			showBytecodeWarningDialog();
			return;
	    } 
	    
	    if( !atLeastOneFile ) {
	    	YAHOO.soss.showErrorDialog("<p>You did not provide any files to upload.</p>",
	    			"Missing Files");
	    	return;
	    }
	    
		doUpload();
	};
	
	var doUpload = function() {
	
		showUploadingPanel();
		
		var callback = {
			upload: function(o) {
	
				YAHOO.soss.uploadingPanel.hide();
				var result = YAHOO.soss.parseJSON(o.responseText);
	
				if( result.ResponseCode < 200 ) {
					YAHOO.soss.showErrorDialog(
						"<p>There was a problem uploading your file.</p>" +
						"<p>Message from the server: " +
						result.Message + "</p>" +
						"<p>Fix the problem and try your upload again.</p>", "Upload Error");
				} else {
					var message = '<p>' + result.Message + '</p>';
	
					if( result.Data.overwrite ) {
						message += '<p>The previous submission was overwritten.</p>';
					}
					showUploadSuccessDialog(message);
	
					// This could be improved so that it only updates the rows
					// that need changing/adding.
					var callback = {
						success : YAHOO.soss.submissionTable.onDataReturnReplaceRows,
						failure : YAHOO.soss.submissionTable.onDataReturnReplaceRows,
						scope : YAHOO.soss.submissionTable
					};
	
					YAHOO.soss.submissionTable.getDataSource().sendRequest('q=getSubmissionList',callback);
					
					// Reset the form
					var form = Dom.get("upload_form");
					form.reset();
					updateFileInputs();
				}
			},
			argument: []
		};
	
		var formObject = Dom.get(UPLOAD_FORM_ID);
		YAHOO.util.Connect.setForm(formObject,true,true);
		YAHOO.util.Connect.asyncRequest('POST', 'upload.php', callback);
	};
	
	var showUploadSuccessDialog = function(message) {
		var dialogid = "upload-success-dialog";
	
		var el = Dom.get(dialogid);
	
		if( ! el ) {
			var buttons = [
				{text:"Ok", handler:function(o){ this.hide(); } , isDefault:true},
			];
			YAHOO.soss.uploadSuccessDialog = new YAHOO.widget.SimpleDialog(
				dialogid,
				{
					width:"300px",
					fixedcenter:true,
					visible:false,
					draggable:false,
					close:false,
					icon:YAHOO.widget.SimpleDialog.ICON_INFO,
					constraintoviewport:true,
					modal:true
				}
			);
	
			YAHOO.soss.uploadSuccessDialog.setHeader("Upload Succeeded");
			YAHOO.soss.uploadSuccessDialog.cfg.queueProperty("buttons", buttons);
			YAHOO.soss.uploadSuccessDialog.render(document.body);
		}
		
		YAHOO.soss.uploadSuccessDialog.cfg.setProperty("text",message);
		YAHOO.soss.uploadSuccessDialog.show();
	};
	
	var showUploadingPanel = function() {
		var panelid = "upload-wait-panel";
	
		var el = Dom.get(panelid);
	
		if( ! el ) {
			YAHOO.soss.uploadingPanel = new YAHOO.widget.Panel(
				panelid,
				{
					width:"240px",
					fixedcenter:true,
					visible:false,
					draggable:false,
					close:false,
					modal:true
				}
			);
			YAHOO.soss.uploadingPanel.setHeader("Uploading, please wait...");
			YAHOO.soss.uploadingPanel.setBody('<img src="img/rel_interstitial_loading.gif" />');
			YAHOO.soss.uploadingPanel.render(document.body);
		}
	
		YAHOO.soss.uploadingPanel.show();
	};
	
	var showFilesPopup = function (e, trEl) {
		var target = e.target;
		var record = this.getRecord(target);
	
		var fileid = record.getData('id');
		var assignName = record.getData('aname');
	
		// Set the panel's header
		YAHOO.soss.submissionFilesPanel.setHeader(assignName + " contents: ");
		// Set body to indicate that the data is being requested
		YAHOO.soss.submissionFilesPanel.setBody(
				'Loading <img src="lib/yui/build/assets/skins/sam/ajax-loader.gif" />');
		// Position the panel to the left of the button
		YAHOO.soss.submissionFilesPanel.cfg.setProperty("context", [target,"tl","tl"] );
		// Make the panel visible
		YAHOO.soss.submissionFilesPanel.show();
		// Request the data for the panel
		YAHOO.util.Connect.asyncRequest('GET', "student.php?q=getFileNames&fileid="+fileid,
		{
			success: function(o) { 
				var text = "";
				var result = YAHOO.soss.parseJSON(o.responseText);
	
				if( result.ResponseCode < 200 ) {
					text = "<div style=\"color:red;\">" + result.Message + "</div>";
				} else {
					text = "<div style=\"font-family: courier,monospaced;\">";
					for( var i = 0; i < result.Data.file_list.length; i++ ) {
						text += result.Data.file_list[i] + "<br />";
					}
					text += "</div>";
				}
				YAHOO.soss.submissionFilesPanel.setBody(text);
			},
			failure: function(o) {
				YAHOO.soss.submissionFilesPanel.setBody(
				"<div style=\"color:red;\">Failed to load data for submission:" +
					o.responseText + "</div>"
				);
			},
			timeout:10000,
			argument: [fileid]
		}
		, null);
	};
	
	var showBytecodeWarningDialog = function() {
		var el = Dom.get('bytecode-warning-dialog');
	
		if( ! el ) {
			var buttons = [
				{text:"Continue", handler:function(o){ this.hide(); doUpload(); } , isDefault:true},
				{
					text:"Cancel",
					handler:function(o) { this.hide(); }
				}
			];
			var message = "<p>You are submitting a Java bytecode file (ending in .class).</p>" +
						  "<p>For most courses, instructors only want the source code files" +
						  "(files ending in <tt>.java</tt>).</p>" +
						  "<p>Are you sure that you want to submit the bytecode file(s)?</p>";
			YAHOO.soss.bytecodeWarningDialog = new YAHOO.widget.SimpleDialog(
				"bytecode-warning-dialog",
				{
					width:"30em",
					fixedcenter:true,
					visible:false,
					draggable:false,
					close:false,
					icon:YAHOO.widget.SimpleDialog.ICON_WARN,
					constraintoviewport:true,
					modal:true
				}
			);
			
			YAHOO.soss.bytecodeWarningDialog.setHeader("Warning: submitting bytecode");
			YAHOO.soss.bytecodeWarningDialog.setBody(message);
			YAHOO.soss.bytecodeWarningDialog.cfg.queueProperty("buttons",buttons);
			YAHOO.soss.bytecodeWarningDialog.render(document.body);
	
		}
	
		YAHOO.soss.bytecodeWarningDialog.show();
	};
	
	var updateFileInputs = function() {
		var sel = Dom.get(NUM_FILES_SELECT_ID);
		var n = sel.options[ sel.selectedIndex ].value;
		var nModules = YAHOO.soss.fileInputModules.length;
	
		if(n != nModules && n > 0 && n <= 10) {
	
			if( n > nModules ) {
				for(i = nModules; i < n; i++) {
					var newModule = new YAHOO.widget.Module("file-input-module-"+i);
					newModule.setBody('<input class="file_input" type="file" name="userfile[]" />');
					newModule.render("file_input_container");
					YAHOO.soss.fileInputModules.push(newModule);
				}
			} else {
				for(i = nModules - 1; i >= n; i-- ) {
					var mod = YAHOO.soss.fileInputModules.pop();
					mod.destroy();
				}
			}
		}
	};
	
	var initUI = function (e) {
		
		YAHOO.util.DataSource.Parser['sqlDate'] = YAHOO.soss.myParseSQLDate;
	
		var columnDefs = [
		    {key:"aname", label:"Assignment Name",
			sortable:true,resizeable:true,width:400},
		    {key:"ddate", label:"Due Date",
			formatter:"date",
			sortable:true,resizeable:true},
		    {key:"rdate", label:"Submission Received",
			formatter: 'sossDateFormat',
			sortable:true,resizeable:true}
		];
	
		var dataSource = new YAHOO.util.XHRDataSource("student.php?");
		dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
		dataSource.doBeforeParseData = YAHOO.soss.ds.preLoad;
		
		dataSource.responseSchema = {
			resultsList: "Data",
			fields: [
				{key:"aname"},
				{key:"ddate", parser:"sqlDate"},
				{key:"rdate", parser:"sqlDate"},
				"id"
			]
		};
	
		YAHOO.soss.submissionTable = new YAHOO.widget.DataTable(
			"submission-list-container",
			columnDefs, 
			dataSource,
			{
				MSG_EMPTY: "No submissions yet.",
				initialRequest: "q=getSubmissionList",
				dateOptions:{format:'%m/%d/%Y %I:%M %p'},
				caption: "Click on a row to see the submitted file name."
			}
		);
	
		YAHOO.soss.submissionTable.subscribe("rowMouseoverEvent", YAHOO.soss.submissionTable.onEventHighlightRow); 
		YAHOO.soss.submissionTable.subscribe("rowMouseoutEvent", YAHOO.soss.submissionTable.onEventUnhighlightRow); 
		YAHOO.soss.submissionTable.subscribe("rowClickEvent", showFilesPopup);
		
		YAHOO.soss.submissionFilesPanel = new YAHOO.widget.Panel("submission-files-panel",
					{
						width: "320px",
						constraintoviewport: true,
						draggable: false,
						visible: false,
						modal: false,
						close: true,
						underlay:"shadow"
					}
				);
		YAHOO.soss.submissionFilesPanel.setHeader("Submission Contents");
		YAHOO.soss.submissionFilesPanel.setBody("Loading...");
		YAHOO.soss.submissionFilesPanel.render(document.body);
	
		YAHOO.util.Event.addListener(NUM_FILES_SELECT_ID, "change", updateFileInputs);
		var uploadButton = new YAHOO.widget.Button("upload-button"); 
		uploadButton.on("click", uploadHandler);
		
		// Modulize the first file input
		var newModule = new YAHOO.widget.Module("file-input-module-0");
		YAHOO.soss.fileInputModules.push(newModule);
		newModule.render();
		
		// Modulize the form
		var formModule = new YAHOO.widget.Module("upload-form-module", {visible:true});
		formModule.render();
		YAHOO.util.Event.addListener("show-hide-form","click",
				function(e) {
					YAHOO.util.Event.preventDefault(e);
					if(formModule.cfg.getProperty("visible")) {
						formModule.hide();
						Dom.addClass('show-hide-form','show-hide-icon-2');
						Dom.removeClass('show-hide-form','show-hide-icon-1');
					} else {
						formModule.show();
						Dom.addClass('show-hide-form','show-hide-icon-1');
						Dom.removeClass('show-hide-form','show-hide-icon-2');
					}
				}
		);
		
		// Get max file size info
		YAHOO.util.Connect.asyncRequest('GET', "student.php?q=getUploadInfo",
				{
					success: function(o) { 
						var result = YAHOO.soss.parseJSON(o.responseText);
						
						if( result.ResponseCode == 200 ) {
							Dom.get(MAX_FILE_SIZE_SPAN_ID).innerHTML = 
								result.Data.uploadMaxFileSize;
							Dom.get(MAX_POST_SIZE_SPAN_ID).innerHTML = 
								result.Data.postMaxSize;
							Dom.get(MAX_FILE_SIZE_HIDDEN_ID).value = 
								result.Data.uploadMaxFileSizeBytes;
						} else {
							YAHOO.soss.showErrorDialog("" + result.Message);
						}
					},
					failure: function(o) { },
					timeout:10000
		
				}, null );
		
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
		Evt.addListener(LOGOUT_LINK_ID, "click", signOff);
		updateAssignmentSelect();
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
	
	YAHOO.soss.fileInputModules = [];
	Evt.onDOMReady(initUI);
})(); */