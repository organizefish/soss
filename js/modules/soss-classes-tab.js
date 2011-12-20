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
	
	var deleteClass = function(e) {
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = classesDT.get('recordset').getRecord(tr.get('id'));
		var fullName = record.getValue("name") + " - " + record.getValue("term") +
		 " " + record.getValue("year");
		var message = "<p>About to delete class: " + fullName + ".</p>";
		message += "<p>Are you sure you want to do this?</p>";
		Y.soss.optionDialog.show( message, function() {
			var url = "delete.php?t=class";
			url += "&id=" + encodeURIComponent(record.getValue('id'));
			Y.io(url ,{
				method: 'GET',
				on: {
					success: function(id, r) {
						if( r.parsedResponse.ResponseCode == 200 ) {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
							Y.fire("soss:class-change");
						} else {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
						}
					}
				}
			});
		}, "Delete", "Cancel");
	};
	
	var classesDT = null;
	var initClassesDT = function() {
		var activeFormatter = function(o) {
			var content = '<input type="checkbox"';
			if( o.value == 'Y' ) content += ' checked="checked"';
			return content + " />";
		};
		var optionsFormatter = function(o) {
			return '<div class="trash-button"></div>';
		};
		var cols = [
		            {key:"name",label:"Name" },
		            {key:"term",label:"Term" },
		            {key:"year",label:"Year" },
		            {key:"active",label:"Active", formatter: activeFormatter},
		            {key:"options", label:"", formatter: optionsFormatter}
		            ];
		var source = new Y.DataSource.IO({
            source: "query.php?q=classes&includeInactive=1"
        }).plug(Y.Plugin.DataSourceJSONSchema, {
	        schema: {
	            resultListLocator: "Data",
	            resultFields: ["id", "name", "term", "year", "active"]
	        }
	    });
		classesDT = new Y.DataTable.Base({ columnset: cols });
		classesDT.plug(Y.Plugin.DataTableDataSource, { datasource: source });
		classesDT.render("#soss-admin-classes-table");
		classesDT.datasource.load();
		
		Y.delegate('change', activeCheckboxChange, '#soss-admin-classes-table', 'input[type="checkbox"]');
		Y.delegate('click', deleteClass, '#soss-admin-classes-table', '.trash-button' );
	};
	
	var activeCheckboxChange = function(e) {
		// Don't allow checkbox to change yet
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = classesDT.get('recordset').getRecord(tr.get('id'));
		var newState = ! (record.getValue('active') == 'Y');
				
		var query = "update.php?a=classActiveStatus";
		query += "&id=" + encodeURIComponent(record.getValue("id"));
		query += "&status=" + encodeURIComponent((newState) ? "Y" : "N");
		
		Y.io(query, {
			method: 'GET',
			on: {
				success: function(id,r) { 
					if( r.parsedResponse.ResponseCode == 200 ) {
						record.get('data').active = newState ? "Y" : "N";
						e.target.set('checked', newState);
						Y.fire('soss:class-change');
					}
				}
			}		
		});
	};
	
	var addClass = function(e) {
		var messNode = Y.one('#soss-admin-classes-tab .message');
		messNode.addClass('error');
		messNode.setContent('');
		var cnameNode = Y.one('#soss-admin-new-class-name');
		var cname = Y.Lang.trim(cnameNode.get('value'));
		var cyear = Y.Lang.trim(Y.one('#soss-admin-class-year').get('value'));
		var cterm = Y.one('#soss-admin-term-select').get('value');
		
		if( cname === '' ) {
			messNode.setContent("Please provide a class name.");
			return;
		}
		
		if( ! cyear.match(/^\d{4}$/) ) {
			messNode.setContent("That doesn't look like a valid year.  The year should have 4 digits.");
			return;
		}
		
		var query = "insert.php?t=class";
		query += "&name=" + encodeURIComponent(cname);
		query += "&year=" + encodeURIComponent(cyear);
		query += "&term=" + encodeURIComponent(cterm);
		
		Y.io(query, {
			method: 'get',
			on: {
				success: function(id, r) { 
					if( r.parsedResponse.ResponseCode == 200 ) {
						cnameNode.set('value','');
						Y.fire('soss:class-change');
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				}
			}
		});
	};
	
	Y.on('soss:admin-ready', function(e) {
		
		// Poplulate terms select
		var sel = Y.one('#soss-admin-term-select');
		for(var i = 0; i < Y.soss.core.terms.length; i++ ) {
			sel.append('<option>'+Y.soss.core.terms[i]+'</option>');
		}
		
		Y.one('#soss-admin-class-year').set("value", ''+(new Date()).getFullYear());
		
		initClassesDT();
		
		Y.on('click', addClass, '#soss-admin-new-class-button');
		Y.on('soss:class-change', function(e) { classesDT.datasource.load(); } );
	});
	
},'2.0.0', { requires: ['soss-core', 'panel', 'event', 'io-base', 'io-form', 'datatable'] });
