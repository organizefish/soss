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

YUI.add('soss-classes-tab', function(Y, name) {
	
	Y.on('soss:admin-ready', function(e) {
		
		// Poplulate terms select
		var sel = Y.one('#soss-admin-term-select');
		for(var i = 0; i < Y.soss.core.terms.length; i++ ) {
			sel.append('<option>'+Y.soss.core.terms[i]+'</option>');
		}
		Y.one('#soss-admin-class-year').set("value", ''+(new Date()).getFullYear());
	});
	
},'2.0.0', { requires: ['soss-core', 'panel', 'event', 'io-base', 'io-form'] });

/*
(function() {
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event,
	    CLASSES_TABLE_ID = "soss-admin-classes-table",
		YEAR_FIELD_ID = "soss-admin-class-year",
		TERM_SELECT_ID = "soss-admin-term-select",
		ADD_CLASS_BUTTON_ID = "soss-admin-new-class-button",
		CLASS_NAME_FIELD_ID = "soss-admin-new-class-name",
		DELETE_CONFIRM_DIALOG_ID = "delete-confirm-dialog-assignment",
		deleteConfirmDialog = null,
		classidToDelete = null,
		classNameToDelete = null;
	
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
						{text:"Delete", handler:function(o){ this.hide(); deleteClass();} }
						]
				}
			);
			
			dlg.setHeader(title);
			dlg.setBody("Placeholder");
			dlg.render(document.body);
			deleteConfirmDialog = dlg;
		}
		message = "<p>About to delete class: " + classNameToDelete + ".</p>";
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
			classidToDelete = rec.getData("id");
			classNameToDelete = rec.getData("name") + " - " + rec.getData("term") +
			 " " + rec.getData("year");
			showDeleteConfirmDialog();
		}
	};
	
	var deleteClass = function() {
		if( ! classidToDelete ) return;
		
		var query = "delete.php?t=class";
		query += "&id=" + YAHOO.soss.urlencode(classidToDelete);
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					if( result.ResponseCode == 200 ) {
						YAHOO.soss.showInfoDialog(result.Message);
						YAHOO.soss.event.onClassChange.fire();
						classidToDelete = null;
						classNameToDelete = null;
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { 
					YAHOO.soss.showErrorDialog("Error accessing server."); },
				timeout:10000
	
			}, null );
	};
	
	var addClass = function() {
		var termSel = Dom.get(TERM_SELECT_ID);
		var cname = YAHOO.lang.trim(Dom.get(CLASS_NAME_FIELD_ID).value);
		var cyear = YAHOO.lang.trim(Dom.get(YEAR_FIELD_ID).value);
		var cterm = termSel.options[termSel.selectedIndex].value;
		
		if( ! cname ) {
			YAHOO.soss.showErrorDialog("Please provide a class name.");
			return;
		}
		
		if( ! cyear.match(/^\d{4}$/) ) {
			YAHOO.soss.showErrorDialog("That doesn't look like a valid year." +
					"  The year should have 4 digits.");
			return;
		}
		
		var query = "insert.php?t=class";
		query += "&name=" + YAHOO.soss.urlencode(cname);
		query += "&year=" + YAHOO.soss.urlencode(cyear);
		query += "&term=" + YAHOO.soss.urlencode(cterm);
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					
					if( result.ResponseCode == 200 ) {
						Dom.get(CLASS_NAME_FIELD_ID).value = "";
						
						YAHOO.soss.ds.classesDataSource.flushCache();
						YAHOO.soss.event.onClassChange.fire();
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { },
				timeout:10000
	
			}, null );
	};
	
	var activeClassCheckbox = function(oArgs) {
		var elCheckbox = oArgs.target;
		var record = this.getRecord(elCheckbox);
		var newState = elCheckbox.checked;
		
		// Prevent the change until we are sure the change took place
		// on the server-side.
		Evt.preventDefault(oArgs.event);
		
		var query = "update.php?a=classActiveStatus";
		query += "&id=" + YAHOO.soss.urlencode(record.getData("id"));
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
	
	var updateDataTable = function () {
		var dt = YAHOO.soss.classDataTable;
		
		var callback = {
			success : dt.onDataReturnReplaceRows,
			failure : dt.onDataReturnReplaceRows,
			scope : dt
		};

		dt.getDataSource().sendRequest('&includeInactive=1',callback);
	};
	
	var updateTermSelect = function() {
		var doUpdate = function(o) {
			var result = YAHOO.soss.parseJSON(o.responseText),
			    termSel = Dom.get(TERM_SELECT_ID);
			if(result.ResponseCode == 200) {
				var terms = result.Data;
				for( var i = 0; i < terms.length; i++ ) {
					termSel.innerHTML += "<option value=\"" + terms[i] + 
					"\">"+terms[i]+"</option>";
				}
			} else {
				YAHOO.soss.showErrorDialog("" + result.Message);
			}
		},
		callback = { 
			success:doUpdate,
			failure: function() { 
				YAHOO.soss.showErrorDialog("Unable to update list of terms."); 
			} 
		};
		YAHOO.util.Connect.asyncRequest('GET', 'query.php?q=terms', callback);
	};
	
	var initUI = function() {
		
		var addButton = new YAHOO.widget.Button(ADD_CLASS_BUTTON_ID); 
		addButton.on("click", addClass );
		
		updateTermSelect();
		
		var yearField = Dom.get(YEAR_FIELD_ID);
		var today = new Date;
		yearField.value = today.getFullYear();
		
		var columnDefs = [
		                  {
		                	  key:"name", 
		                	  label:'Name',
		                	  sortable:true,
		                	  resizeable:true, width:350
		                  },
		                  {
		                	  key:"term", label:"Term",
		                	  sortable:true, resizeable:true
		                  },
		                  {
		                	  key:"year", label:"Year",
		                	  sortable:true,resizeable:false
		                  },
		                  { key:"active", label:"Active",
		                	  sortable:true, resizeable:false,
		                	  formatter:'checkbox'},
		                 { key:"del", label:"",
			                	  sortable:false,resizeable:false,
			                	  formatter:YAHOO.soss.deleteButtonFormatter,
			                	  className:"delete-row-cell"}
		];
		var dt = new YAHOO.widget.DataTable(
				CLASSES_TABLE_ID,
				columnDefs, YAHOO.soss.ds.classesDataSource,
				{
					MSG_EMPTY: "No classes",
					initialLoad: true,
					initialRequest:"&includeInactive=1"
				}
		);
		dt.subscribe("checkboxClickEvent", activeClassCheckbox);
		dt.subscribe("cellClickEvent", deleteHandler);
		
		YAHOO.soss.classDataTable = dt;
		YAHOO.soss.event.onClassChange.subscribe(updateDataTable);
	};
	
	Evt.onDOMReady(initUI);
})();*/