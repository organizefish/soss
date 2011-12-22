YUI.add('soss-passwd-dialog', function(Y, name) {
	
	Y.namespace('soss.passwdDialog');
	Y.soss.passwdDialog.dialog = null;
	var doChange = null;
	Y.soss.passwdDialog.show = function( uname, requireCurrentPass ) {
		
		doChange = function() {
			var url = "update.php?";
			url += "a=passwd";
			var messageNode = Y.soss.passwdDialog.dialog.getStdModNode(Y.WidgetStdMod.BODY).one('.message');
			Y.io(url, {
				method: 'POST',
				form: {id:'soss-passwd-dialog'},
				data: 'uname=' + encodeURIComponent(uname),
				on:{
					success: function(id,resp,args){
						if(resp.parsedResponse.ResponseCode == 200) {
							messageNode.removeClass('error');
							messageNode.setContent("Password successfully changed.");
							Y.all('#soss-passwd-dialog input[type="password"]').each( function(node) { node.set('value',''); });
							Y.later(2500, Y, function(){ Y.soss.passwdDialog.dialog.hide(); });
						} else {
							messageNode.addClass('error');
							messageNode.setContent(resp.parsedResponse.Message);
						}
						messageNode.setStyle('display', 'block');
					},
					failure: function(id,resp,args) {
						messageNode.addClass('error');
						messageNode.setContent("Error contacting server.");
						messageNode.setStyle('display', 'block');
					}
				}
			});
		};
		
		// Lazy creation
		if(Y.soss.passwdDialog.dialog == null ) {
			var content = '<form id="soss-passwd-dialog"><h3></h3><ul>';
			content += '<li class="current-pass"><label>Current Password:</label><input type="password" name="curr_pass" /></li>';
			content += '<li class="new-pass-1"><label>New Password:</label><input type="password" name="new_pass_1" /></li>';
			content += '<li class="new-pass-2"><label>New Password (again):</label><input type="password" name="new_pass_2" /></li>';
			content += '</ul><p class="message"></p></form>';
			
			Y.soss.passwdDialog.dialog = new Y.Panel( {
				width: 450,
				modal: true,
				centered: true,
				render: true,
				visible: false,
				bodyContent: content,
				zIndex: 2,
				headerContent: 'Change Password'
			});
			Y.soss.passwdDialog.dialog.addButton({value:"Change", action: function(e) { doChange(); }, section:Y.WidgetStdMod.FOOTER});
			Y.soss.passwdDialog.dialog.addButton({value:"Cancel", action: function(e) { Y.soss.passwdDialog.dialog.hide(); }, section:Y.WidgetStdMod.FOOTER});
		}
		
		var contentNode = Y.soss.passwdDialog.dialog.getStdModNode(Y.WidgetStdMod.BODY);
		contentNode.one('.message').setStyle('display', 'none');
		if( ! requireCurrentPass ) {
			contentNode.one('.current-pass').setStyle('display', 'none');
		} else {
			contentNode.one('.current-pass').setStyle('display', 'block');
		}
		contentNode.one('h3').setContent("Changing password for: " + uname);
		Y.soss.passwdDialog.dialog.show();
	};
	
}, '2.0.0', { requires: ['panel', 'event', 'io-base', 'io-form'] });