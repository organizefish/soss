YUI.add('soss-students-tab', function(Y, name) {
	var chpass = function(e) {
		Y.log("chpass");
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = studentsDT.get('recordset').getRecord(tr.get('id'));
		Y.soss.passwdDialog.show(record.getValue('uname'), false, function() {} );
	};
	var changeGraderStatus = function (e) { 
		Y.log("changeGraderStatus");
		// Don't allow checkbox to change yet
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = studentsDT.get('recordset').getRecord(tr.get('id'));
		var newState = ! (record.getValue('grader') == 'Y');
				
		var query = "update.php?a=stuGraderStatus";
		query += "&uname=" + encodeURIComponent(record.getValue("uname"));
		query += "&status=" + encodeURIComponent((newState) ? "Y" : "N");
		
		Y.io(query, {
			method: 'GET',
			on: {
				success: function(id,r) { 
					if( r.parsedResponse.ResponseCode == 200 ) {
						record.get('data').grader = newState ? "Y" : "N";
						e.target.set('checked', newState);
					}
				}
			}		
		});
	};
	var deleteStudent = function(e) {
		Y.log("deleteStudent");
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = studentsDT.get('recordset').getRecord(tr.get('id'));
		var uname = record.getValue('uname');
		var message = "<p>About to delete student with username: " + uname + ".</p>";
		message += "<p>Are you sure you want to do this?</p>";
		Y.soss.optionDialog.show( message, function() {
			var url = "delete.php?t=student";
			url += "&uname=" + encodeURIComponent(uname);
			Y.io(url ,{
				method: 'GET',
				on: {
					success: function(id, r) {
						if( r.parsedResponse.ResponseCode == 200 ) {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
							Y.fire("soss:student-change");
						} else {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
						}
					}
				}
			});
		}, "Delete", "Cancel");
	};
	var addStudent = function(e) {
		Y.log("addStudent");
		e.preventDefault();
		var mess = Y.one('#student-add-message');
		var uname = Y.Lang.trim(Y.one('#soss-admin-new-stu-uname').get('value'));
		if( !uname ) {
			mess.setStyle('display', 'inline');
			mess.addClass('error');
			mess.setContent('Please provide a username.');
		}
		
		var email = Y.Lang.trim( Y.one('#soss-admin-new-stu-email').get('value'));
		var fname = Y.Lang.trim( Y.one('#soss-admin-new-stu-fname').get('value'));
		var lname = Y.Lang.trim( Y.one('#soss-admin-new-stu-lname').get('value'));
		var postData = 'uname=' + encodeURIComponent(uname) + '&' +
	      'email=' + encodeURIComponent(email) + '&' +
	      'fname=' + encodeURIComponent(fname) + '&' +
	      'lname='+ encodeURIComponent(lname);
		Y.io( 'insert.php?t=student', {
			method: 'POST',
			data: postData,
			on: {
				success: function(id, r) {
					var code = r.parsedResponse.ResponseCode;
					mess.setStyle('display', 'inline');
					if( code == 200 ) {
						mess.removeClass('error');
						mess.setContent(r.parsedResponse.Message);
						studentsDT.datasource.load();
					} else {
						mess.addClass('error');
						mess.setContent(r.parsedResponse.Message);
					}
					Y.later(10000, Y, function(){ mess.setStyle('display', 'none'); });
				}
			}
		});
	};
	var bulkAddStudents = function(e) {
		Y.log("bulkAddStudents");
		e.preventDefault();
		var mess = Y.one('#bulk-add-message');
		var button = Y.one('#soss-admin-bulk-add-button');
		mess.setContent('Creating accounts...');
		mess.addClass('spinner');
		mess.setStyle('display', 'inline');
		button.set('disabled', true);
		var list = encodeURIComponent(Y.one('#class-list-textarea').get('value'));
		
		Y.io('insert.php?t=bulkstudent', {
			method: 'POST',
			data: 'class_list=' + list,
			on: {
				success: function(id, r) {
					mess.removeClass('spinner');
					button.set('disabled', false);
					var code = r.parsedResponse.ResponseCode;
					if( code == 200 ) {
						mess.removeClass('error');
						mess.setContent(r.parsedResponse.Message);
						var errs = r.parsedResponse.Data.errors;
						if( errs.length > 0 ) {
							var message = '<p>' + r.parsedResponse.Message + '</p>';
							message += '<p class="error">Some errors occured:</p><ul>';
							for( var i = 0; i < errs.length; i++ )
								message += "<li>" + errs[i] + "</li>";
							message += "</ul>";
							Y.soss.admin.showInfoMessage(message);
						}
						studentsDT.datasource.load();
					} else {
						mess.addClass('error');
						mess.setContent(r.parsedResponse.Message);
					}
					Y.later(5000, Y, function(){ mess.setStyle('display', 'none'); });
				}
			}
		});
	};
	
	var studentsDT = null;
	var instructionsPanel = null;
	var showInstructionsPanel = function( e ) {
		e.preventDefault();
		// Lazy creation
		if(instructionsPanel == null ) {
			var content = '<p>Provide a list of the students to be added, ';
		    content += 'one student per line.  Each line can have any of the following three formats:</p>';
		    content += '<ul><li>A single email address.  (Example: <code>jdoe@example.com</code>)</li>';
		    content += '<li>A standard CSV style with last name, first name and email.';
		    content += '(Example:<code>Doe, John, jdoe@example.com</code>)</li>';
		    content += '<li>Last name, then a comma, then first name, followed by the email in';
		    content += ' parenthesis.  (Example: <code>Doe, John (jdoe@example.com)</code>).</li></ul>';
		    content += '<p>(Note: A full class list in the above format can be generated from Banner by going to "Summary';
		    content += ' Class List w/o Hyperlinks", selecting the top-most checkbox under the E-Mail';
		    content += ' column, then clicking on "Send email to selected students".)</p>';
		    content += '<p>If LDAP authentication is enabled, the system will attempt to find a LDAP account';
		    content += ' for each student by searching the LDAP tree for the email address. If the account is located, ';
		    content += ' the student is added to the class.</p>';
			
			instructionsPanel = new Y.Panel( {
				width: 450,
				modal: false,
				render: true,
				visible: false,
				bodyContent: content,
				zIndex: 1,
				align: {node: '#soss-admin-bulk-instructions', points:[Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.BL] },
				hideOn: [ {eventName: 'clickoutside'}, {node:Y.one('#soss-admin-bulk-instructions'), eventName: 'click'}]
			});
		}
		if( !instructionsPanel.get('visible') ) {
			instructionsPanel.show();
		}
	};
	
	Y.on('soss:admin-ready', function(e) {
		
		var fullNameFormatter = function(o) {
			var fname = o.record.getValue('fname');
			var lname = o.record.getValue('lname');
			var name = "";
			if( lname ) name += lname;
			if( fname ) name += ", " + fname;
			return name;
		};
		var graderFormatter = function(o) {
			var result = '<input class="grader-cb" type="checkbox" ';
			if( o.value == 'Y' ) result += 'checked="checked"';
			return result + ' />';
		};
		var emailFormatter = function(o) {
			if( o.value ) {
				return '<a href="mailto:' + o.value + '">' + o.value + '</a>';
			} else 
				return '';
		};
		var chpassFormatter = function(o) {
			if(Y.soss.core.useLdap) return '';
			return '<a class="chpass-link" href="#">Change Password</a>';
		};
		var deleteFormatter = function(o) {return '<div class="trash-button"></div>'; };
		var cols = [
		            {key:"uname",label:"Username" },
		            {key:"name",label:"Full Name", formatter:fullNameFormatter },
		            {key:"grader",label:"Grader", formatter:graderFormatter },
		            {key:"email",label:"Email", formatter: emailFormatter}
		            ];
		if( ! Y.soss.core.useLdap ) 
			cols.push({key:"chpass", label:"", formatter: chpassFormatter});
		cols.push( {key:"delete", label: "", formatter: deleteFormatter} );
		
		var source = new Y.DataSource.IO({
            source: "query.php?q=students"
        }).plug(Y.Plugin.DataSourceJSONSchema, {
	        schema: {
	            resultListLocator: "Data",
	            resultFields: ["uname", "lname", "fname", "email", "grader"]
	        }
	    });
		studentsDT = new Y.DataTable.Base({ columnset: cols });
		studentsDT.plug(Y.Plugin.DataTableDataSource, { datasource: source });
		studentsDT.render("#soss-admin-students-table");
		studentsDT.datasource.load();
		
		if( ! Y.soss.core.useLdap )
			Y.delegate('click', chpass, '#soss-admin-students-table', '.chpass-link');
		Y.delegate('click', deleteStudent, '#soss-admin-students-table', '.trash-button');
		Y.delegate('click', changeGraderStatus, '#soss-admin-students-table', '.grader-cb');
		
		Y.on('click', addStudent, '#soss-admin-new-stu-button');
		Y.on('click', bulkAddStudents, '#soss-admin-bulk-add-button');
		Y.on('click', showInstructionsPanel, '#soss-admin-bulk-instructions');
		
		Y.on('soss:select-class', function(e) { studentsDT.datasource.load(); });
		Y.on('soss:student-change', function(e) {studentsDT.datasource.load(); });
	});
	
}, '2.0.0', { requires: ['soss-passwd-dialog', 'soss-option-dialog', 'panel', 'event', 'io-base', 'io-form'] });