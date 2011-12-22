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
				'soss-download-tab': {path: 'soss-download-tab.js', requires: ['soss-core', 'event', 'io-base', 'io-form', 'datatable','datatype-date-math', 'datatype-date-parse']}
			}
		}	
	}
};

YUI(config).use('soss-core', 'soss-download-tab', function(Y) {
	Y.one('body').addClass('yui3-skin-sam');
	
	Y.on('soss:ready', function() {
		Y.one('#soss-version').setContent(Y.soss.core.version);
		Y.all('.uname').setContent(Y.soss.core.session.uname);
		Y.one('#top-bar-class-name').setContent(Y.soss.core.session.className);
		Y.one('#logout-link').on('click', Y.soss.event.logout);
		Y.fire('soss:admin-ready');
	});
});