YUI.add('soss-option-dialog', function(Y, name) {
	
	Y.namespace('soss.optionDialog');
	var dialog = null;
	Y.soss.optionDialog.show = function( content, onOk, confirmButton, cancelButton ) {
		confirmButton = confirmButton || "Ok";
		cancelButton = cancelButton || "Cancel";
		// Lazy creation of the panel
		if( dialog == null ) {
			dialog = new Y.Panel( {
				width: 450,
				modal: true,
				centered: true,
				render: true,
				visible: false,
				zIndex: 3,
				buttons: [
				          {value: "Yes", classNames: 'button-confirm', action: function(e) {e.preventDefault(); dialog.hide(); onOk(); }, section:Y.WidgetStdMod.FOOTER },
				          {value: "No", classNames: 'button-cancel', action: function(e) {e.preventDefault(); dialog.hide(); }, section:Y.WidgetStdMod.FOOTER }
				          ]
			});
		}
		var id = dialog.get('id');
		Y.one('#' + id + " .button-confirm .yui3-button-content").setContent(confirmButton);
		Y.one('#' + id + " .button-cancel .yui3-button-content").setContent(cancelButton);
		dialog.setStdModContent(Y.WidgetStdMod.BODY, content);
		dialog.show();
	};
	
}, '2.0.0', { requires: ['panel', 'event'] });