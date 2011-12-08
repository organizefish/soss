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

YUI(config).use('soss-core', 'soss-passwd-dialog', 'datatype-date-math', 'datatype-date-parse', 'io-form', 'io-upload-iframe', 'panel','datasource-io', 'datatable',function(Y) {
	
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
		var aNameFormatter = function(o) {
			if( o.rowindex == 0 ) {
				o.column.thNode.addClass('aname-column');
			}
			return o.value;
		};
		var rDateFormatter = function(o) {
			if( o.rowindex >= 0 ) {
				var rd = Y.DataType.Date.parse(o.record.getValue('rdate'));
				var dd = Y.DataType.Date.parse(o.record.getValue('ddate'));
				var d = Y.DataType.Date.format(rd, {format: '%m/%d/%Y %I:%M %p'});
				if( Y.DataType.Date.isGreater(rd, dd) ) {
					return '<span class="late">'+d+'</span>';
				}
			}
			return d;
		};
		var cols = [
		            {key:"aname",label:"Assignment Name", formatter: aNameFormatter },
		            {key:"ddate",label:"Due Date", formatter: Y.soss.formatter.date },
		            {key:"rdate",label:"Submission Received", formatter: rDateFormatter }
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
		
		Y.all('.uname').setContent(Y.soss.core.session.uname);
		Y.one('#top-bar-class-name').setContent(Y.soss.core.session.className);
		Y.one('#soss-version').setContent(Y.soss.core.version);
		initSubmissionList();
	});
});
