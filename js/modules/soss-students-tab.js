YUI.add('soss-students-tab', function(Y, name) {
	
	var instructionsPanel = null;
	var showInstructionsPanel = function( e ) {
		e.preventDefault();
		// Lazy creation
		if(instructionsPanel == null ) {
			var content = '<p>Class list must contain a list of the students,';
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
		    content += ' for each student by searching for the email address. If the account is located, ';
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
		Y.on('click', showInstructionsPanel, '#soss-admin-bulk-instructions');
	});
	
}, '2.0.0', { requires: ['panel', 'event', 'io-base', 'io-form'] });