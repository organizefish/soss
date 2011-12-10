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
	
	Y.on('soss:admin-ready', function(e) {
		var sel = Y.one('#soss-admin-new-assign-ddmonth');
		var d = new Date(0,0,1);
		for( var i = 0; i < 12; i++ ) {
			d.setMonth(i);
			sel.append('<option value="'+i+'">' + Y.DataType.Date.format(d,{format: "%b"}) + '</option>');
		}
		sel = Y.one('#soss-admin-new-assign-ddday');
		for( var i = 1; i <= 31; i++ ) 
			sel.append('<option>' + i + '</option>');
		Y.one('#soss-admin-new-assign-ddyear').set('value', (new Date()).getFullYear());
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
		
	});
	
},'2.0.0', { requires: ['soss-core', 'datatype-date-format', 'event', 'io-base', 'io-form', 'datatable'] });
