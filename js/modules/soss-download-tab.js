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

YUI.add('soss-download-tab', function(Y, name) {
	
	// The datatable
	var subsDT = null;

	var updateStudentSelect = function() {
		var select = Y.one('#soss-admin-student-select');
		select.setContent("<option>Loading...</option>");
		var buildSelect = function(id,r) {
			var data = r.parsedResponse.Data;
			select.setContent('<option value="__all__">[All]</option>');
			for(var i=0 ;i < data.length ; i++) {
				select.append('<option value="' + data[i].uname +
					'">'+ data[i].uname + '</option>');
			}
		};
		var callback = { success : buildSelect };
		Y.io( "query.php?q=students", { on: callback } );
	};
	var updateAssignSelect = function() {
		var select = Y.one('#soss-admin-assignment-select');
		select.setContent("<option>Loading...</option>");
		var buildSelect = function(id,r) {
			var data = r.parsedResponse.Data;
			select.setContent('<option value="__all__">[All]</option>');
			for(var i=0 ;i < data.length ; i++) {
				select.append('<option>'+ data[i].name + '</option>');
			}
		};
		var callback = { success : buildSelect };
		Y.io( "query.php?q=assignments", { on: callback } );
	};
	
	var loadSubmissions = function(e) {
		var stu = Y.one('#soss-admin-student-select').get('value');
		var assign = Y.one('#soss-admin-assignment-select').get('value');
		var query = '';
		if( stu != "__all__" ) query += 'student=' + encodeURIComponent(stu);
		if( assign != "__all__") query += '&assignment=' + encodeURIComponent(assign);
		subsDT.datasource.load( { request: query });
	};
	
	var dlFiles = function(e) {
		e.preventDefault();
		var count = 0;
		Y.all('#soss-download-form input[type="checkbox"]').each(function(node,idx,o) {
			if( node.get('name') == 'file_list[]' && node.get('checked') ) count++;
		});
		if(count > 0 ) Y.one('#soss-download-form').submit();
	};
	
	var selectAllCB = function(e) {
		var state = e.target.get('checked');
		Y.all('#soss-download-form input[type="checkbox"]').each(function(node,idx,o){
			if( node.get('name') == 'file_list[]' ) node.set('checked',state);
		});
	};
	
	Y.on('soss:admin-ready', function(e) {
		
		// Build the data table for the download list
		var ckboxFormatter = function(o) {
			return '<input type="checkbox" name="file_list[]" value="' + o.record.getValue('id') + '" />';
		};
		var sdateFormatter = function(o) {
			var sd = Y.DataType.Date.parse(o.record.getValue('sdate'));
			var dd = Y.DataType.Date.parse(o.record.getValue('ddate'));
			var d = Y.DataType.Date.format(sd, {format: '%m/%d/%Y %I:%M %p'});
			if( Y.DataType.Date.isGreater(sd, dd) ) {
				return '<span class="late">'+d+'</span>';
			}
			return d;
		};
		var cols = [
		            { key:"ckbox", 
		              label:'<input id="dl-select-all" type="checkbox" />',
		              formatter: ckboxFormatter },
		            { key:"uname", label:"Username"},
		            { key:"name", label:"Name" },
		            { key:"aname", label:"Assignment"},
		            { key:"ddate", label:"Due", formatter: Y.soss.formatter.date},
		            { key:"sdate", label:"Submitted", formatter: sdateFormatter}
		];
		var source = new Y.DataSource.IO({
            source: "query.php?q=submissions&"
        }).plug(Y.Plugin.DataSourceJSONSchema, {
	        schema: {
	            resultListLocator: "Data",
	            resultFields: ['id', "uname", "name", "aname", "ddate", "sdate"]
	        }
	    });
		subsDT = new Y.DataTable.Base({ columnset: cols });
		subsDT.plug(Y.Plugin.DataTableDataSource, { datasource: source });
		subsDT.render("#soss-admin-submission-table");
		
		updateStudentSelect();
		updateAssignSelect();
		
		Y.on('soss:select-class', function(e) {
			updateStudentSelect(); 
			updateAssignSelect();
			subsDT.get('recordset').empty();
		});
		Y.on('click', loadSubmissions, '#soss-admin-list-button');
		Y.on('click', dlFiles, '#download-button');
		Y.on('change', selectAllCB, '#dl-select-all');
		Y.on('soss:assign-change', updateAssignSelect);
	});
	
},'2.0.0', { requires: ['soss-core', 'event', 'io-base', 'io-form', 'datatable'] });
