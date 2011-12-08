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
				'soss-core': {path: 'soss-core.js', requires: ['dump', 'datatype-date-parse','datatype-date-format', 'event','console','io-base','json-parse','datasource-io','datasource-jsonschema']},
				'soss-passwd-dialog': {path: 'soss-passwd-dialog.js', requires: ['panel', 'event', 'io-base', 'io-form']}
			}
		}	
	}
};

YUI(config).use('soss-core', 'soss-passwd-dialog', 'io-form', 'io-upload-iframe', 'panel','datasource-io', 'datatable',function(Y) {
	
	var yesNoPanel = null;
	var showYesNoPanel = function(message, yesHook) {
		// Lazy creation of the panel
		if( yesNoPanel == null ) {
			yesNoPanel = new Y.Panel( {
				srcNode: '#yesNoPanel',
				width: 450,
				modal: true,
				headerContent: 'Warning',
				centered: true,
				render: true,
				visible: false,
				buttons: [
				          {value: "Yes", action: function(e) {e.preventDefault(); yesNoPanel.hide(); yesHook(); }, section:Y.WidgetStdMod.FOOTER },
				          {value: "No", action: function(e) {e.preventDefault(); yesNoPanel.hide(); }, section:Y.WidgetStdMod.FOOTER }
				          ]
			});
		}
		yesNoPanel.setStdModContent(Y.WidgetStdMod.BODY, message);
		yesNoPanel.show();
	};
	
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
	
	    if( classFile ) {
	    	showYesNoPanel("<p>You are submitting a Java bytecode file (ending in <code>.class</code>).</p>" +
				  "<p>For most courses, instructors only want the source code files" +
				  "(files ending in <code>.java</code>).</p>" +
				  "<p>Are you sure that you want to submit the bytecode file(s)?</p>", doUpload ); 
	    	return; 
	    }
	    if( backupFile ) { 
	    	showYesNoPanel("<p>You are submitting an editor's backup file (ending in <code>~</code>).</p>" +
				  "<p>Some text editors and IDEs create backup files that end in <code>~</code>.  Since a backup file " +
				  " may not contain the most recent version of your code, you probably don't want to submit this file.</p>" +
				  "<p>Are you sure that you want to submit the backup file(s)?</p>", doUpload ); 
	    	return; 
	    }
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
						submissionDT.datasource.load();
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
	
	var submissionDT = null;
	var initSubmissionList = function() {
		var cols = [
		            {key:"aname",label:"Assignment Name",width:400},
		            {key:"ddate",label:"Due Date", formatter: Y.soss.formatter.date },
		            {key:"rdate",label:"Submission Received", formatter: Y.soss.formatter.date}
		            ];
		var source = new Y.DataSource.IO({
            source: "student.php?q=getSubmissionList"
        }).plug(Y.Plugin.DataSourceJSONSchema, {
	        schema: {
	            resultListLocator: "Data",
	            resultFields: ["aname", "ddate", "rdate"]
	        }
	    });
		submissionDT = new Y.DataTable.Base({
		    columnset: cols,
		    summary: "Previous Submissions"
		});
		submissionDT.plug(Y.Plugin.DataTableDataSource, {
		    datasource: source
		});
		submissionDT.render("#submission-list-container");
		submissionDT.datasource.load();
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
		
		Y.one('#logout-link').on('click', function(e) {
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
		});
		
		if( Y.soss.core.useLdap ) {
			Y.one('#change-pass-link').setStyle('display', 'none');
		} else {
			Y.one('#change-pass-link').on('click', function(e) {
				e.preventDefault();
				Y.soss.passwdDialog.show(Y.soss.core.session.uname, true);
			});
		}
		
		Y.one('#top-bar-uname').setContent(Y.soss.core.session.uname);
		Y.one('#top-bar-class-name').setContent(Y.soss.core.session.className);
		Y.one('#soss-version').setContent(Y.soss.core.version);
		initSubmissionList();
	});
});

/*
(function() {
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