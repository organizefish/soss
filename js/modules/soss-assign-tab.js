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

YUI.add('soss-assign-tab', function(Y, name) {
	
	
	var deleteAssignment = function(e) {
		e.preventDefault();
		var tr = e.target.ancestor('tr');
		var record = assignDT.get('recordset').getRecord(tr.get('id'));
		var message = "<p>About to delete assignment: " + record.getValue('name') + ".</p>";
		message += "<p>Are you sure you want to do this?</p>";
		Y.soss.optionDialog.show( message, function() {
			var url = "delete.php?t=assignment";
			url += "&name=" + encodeURIComponent(record.getValue('name'));
			Y.io(url ,{
				method: 'GET',
				on: {
					success: function(id, r) {
						if( r.parsedResponse.ResponseCode == 200 ) {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
							Y.fire("soss:assign-change");
						} else {
							Y.soss.admin.showInfoMessage(r.parsedResponse.Message);
						}
					}
				}
			});
		}, "Delete", "Cancel");
	};
	
	// Data table
	var assignDT = null;
	
	var addAssignment = function(e) {
		var aname = Y.Lang.trim(Y.one('#soss-admin-new-assign-name').get('value'));
		
		var query = "insert.php?t=assignment";
		if( ! aname ) return;
		query += "&aname=" + encodeURIComponent(aname);
		
		if( Y.one('#soss-admin-new-assign-ddcb').get('checked') ) {
			var dmonth = Y.one('#soss-admin-new-assign-ddmonth').get('value');
			var dday = Y.one('#soss-admin-new-assign-ddday').get('value');
			var dyear = Y.one('#soss-admin-new-assign-ddyear').get('value');
			var dhour = Y.one('#soss-admin-new-assign-ddhour').get('value');
			var dmin = Y.one('#soss-admin-new-assign-ddmin').get('value');
			var ddate = null;
			ddate = new Date(dyear, dmonth, dday, dhour, dmin);
			query += "&ddate=" + encodeURIComponent(Y.DataType.Date.format(ddate,{format:"%Y-%m-%d %H:%M:00"}));
		}
		
		Y.io( query, {
			on: {
				success: function(id, r) { 
					if( r.parsedResponse.ResponseCode == 200 ) {
						Y.one('#soss-admin-new-assign-name').set('value','');
						Y.fire('soss:assign-change');
					}
				}
			}
		});
	};
	
	Y.on('soss:admin-ready', function(e) {
		// Setup the input elements
		var sel = Y.one('#soss-admin-new-assign-ddmonth');
		var d = new Date(0,0,1);
		var today = new Date();
		for( var i = 0; i < 12; i++ ) {
			d.setMonth(i);
			sel.append('<option value="'+i+'">' + Y.DataType.Date.format(d,{format: "%b"}) + '</option>');
		}
		sel.set('selectedIndex', today.getMonth());
		sel = Y.one('#soss-admin-new-assign-ddday');
		for( var i = 1; i <= 31; i++ ) sel.append('<option>' + i + '</option>');
		sel.set('selectedIndex', today.getDate() - 1);
		Y.one('#soss-admin-new-assign-ddyear').set('value', today.getFullYear());
		sel = Y.one('#soss-admin-new-assign-ddhour');
		for( var i = 0; i <= 23; i++ ) sel.append('<option>' + ((i<10)?('0'+i) : i) + '</option>');
		sel = Y.one('#soss-admin-new-assign-ddmin');
		for( var i = 0; i < 60; i+=5 ) sel.append('<option>' + ((i<10)?('0'+i) : i) + '</option>');
		
		var toggleDdate = function(state) {
			Y.one('#soss-admin-new-assign-ddyear').set('disabled', state);
			Y.all('#soss-admin-new-assign-ddgroup select').each( function(node,idx,o) {
				node.set('disabled', state);
			});
		};
		toggleDdate(true);
		Y.on('change', function(e) { toggleDdate(!e.target.get('checked')); }, 
				'#soss-admin-new-assign-ddcb');
		
		// Setup the data table
		var optionsFormatter = function(o) {
			return '<div class="trash-button"></div>';
		};
		var cols = [
		            { key:"name", label:'Name' },
		            { key:"ddate", label:"Due", formatter: Y.soss.formatter.date},
		            { key:"del", label:"", formatter: optionsFormatter }
		];
		var source = new Y.DataSource.IO({
            source: "query.php?q=assignments"
        }).plug(Y.Plugin.DataSourceJSONSchema, {
	        schema: {
	            resultListLocator: "Data",
	            resultFields: ["name", "ddate"]
	        }
	    });
		assignDT = new Y.DataTable.Base({ columnset: cols });
		assignDT.plug(Y.Plugin.DataTableDataSource, { datasource: source });
		assignDT.render("#soss-admin-assignment-table");
		assignDT.datasource.load();
		Y.delegate('click', deleteAssignment, '#soss-admin-assignment-table', '.trash-button' );
		
		Y.on('soss:assign-change', function(e) { assignDT.datasource.load();});
		
		Y.on('click', addAssignment, '#soss-admin-new-assign-button');
		Y.on('key', addAssignment, '#soss-admin-new-assign-name', 'enter');
		Y.on('soss:select-class', function(e) { assignDT.datasource.load(); });
	});
	
},'2.0.0', { requires: ['soss-core', 'datatype-date-format', 'datatype-number-parse','event', 'io-base', 'io-form', 'datatable'] });
