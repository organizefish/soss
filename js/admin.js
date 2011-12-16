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
				'soss-passwd-dialog': {path: 'soss-passwd-dialog.js', requires: ['panel', 'event', 'io-base', 'io-form']},
				'soss-classes-tab': {path: 'soss-classes-tab.js', requires: ['soss-core', 'panel', 'event', 'io-base', 'io-form']},
				'soss-download-tab': {path: 'soss-download-tab.js', requires: ['soss-core', 'event', 'io-base', 'io-form', 'datatable']},
				'soss-assign-tab': {path: 'soss-assign-tab.js', requires:  ['soss-core', 'datatype-number-parse', 'datatype-date-format', 'event', 'io-base', 'io-form', 'datatable']},
				'soss-students-tab': {path: 'soss-students-tab.js', requires: ['panel', 'soss-option-dialog', 'event', 'io-base', 'io-form'] },
				'soss-option-dialog' : {path: 'soss-option-dialog.js', requires: ['panel', 'event'] }
			}
		}	
	}
};

YUI(config).use('soss-core', 'soss-classes-tab', 'soss-download-tab', 'soss-assign-tab', 'soss-students-tab', 'tabview', 'soss-passwd-dialog', 'datatype-date-math', 'datatype-date-parse', 'io-form','panel','overlay','datasource-io', 'datatable', function(Y) {

	var messageOverlay = null;
	Y.namespace('soss.admin');
	Y.soss.admin.showInfoMessage = function(message) {
		
		if( messageOverlay == null ) {
			messageOverlay = new Y.Overlay({
		        width:"450px",
		        bodyContent: "",
		        zIndex:3,
		        render: true,
		        visible: false,
		        align: {node: '#top-bar', points: [Y.WidgetPositionAlign.TC, Y.WidgetPositionAlign.BC]}
		    });
		}
		messageOverlay.setStdModContent(Y.WidgetStdMod.BODY, 
				'<div class="admin-info-message">'+ message+'</div>');
		messageOverlay.show();
		Y.later(20000, Y, function() {messageOverlay.hide();});
	};
	
	var adminTabView;
	
	// Class has been changed server-side, update UI
	var changeClassUI = function(id, name) {
		Y.soss.core.session.classid = id;
		Y.soss.core.session.className = name;
		Y.all('.class-name').setContent(Y.soss.core.session.className);
		Y.fire('soss:select-class');
	};
	
	var changeClass = function(e) {
		var selectedId = e.target.get('value');
		setClass(selectedId);
	};
	
	var setClass = function(id) {
		var cfg = {
				method: 'GET',
				on: {
					success: function(id, resp, args) {
						var r = resp.parsedResponse;
						if( resp.parsedResponse.ResponseCode == 200 ) {
							changeClassUI(r.Data.classid,r.Data.class_name);
						}
					}
				}
			};
		var url = 'setclass.php?id=' + encodeURIComponent(id);
		Y.io(url, cfg);
	};
	
	var updateClassList = function(e) {
		var cbox = Y.one('#inactive-class-checkbox');
		var select = Y.one('#change-class-select');
		select.setContent("<option>Loading...</option>");
		
		var buildSelect = function(id,resp,args) {
			var oData= resp.parsedResponse.Data;
			select.setContent( '<option value="-1">[Select Class]</option>' );
			for( var i=0 ; i < oData.length ; i++) {
				select.append( '<option value="' + oData[i].id +
					'">'+ oData[i].name + " -- " +
					oData[i].term + ", " + oData[i].year + '</option>');
			}
			if( Y.soss.core.session.classid < 0 ) {
				select.set('selectedIndex', 0);
			} else {
				var found = false;
				select.all('option').each( function(node, idx, list) {
					var id = node.get('value');
					if( id == Y.soss.core.session.classid ) {
						select.set('selectedIndex', idx);
						found = true;
					}
				});
				if( ! found ) {
					select.set('selectedIndex', 0);
					setClass(select.get('value'));
				}
			}
		};
		
		var callback = { success : buildSelect };
		
		var url = "query.php?q=classes";
		if(cbox.get('checked')) url += "&includeInactive=1";
		Y.io( url, { on: callback } );
	};
	
	Y.on("soss:ready", function(e) {
		Y.one('#soss-version').setContent(Y.soss.core.version);
		
		// Publish the admin-ready event
		Y.publish('soss:admin-ready', {fireOnce: true});
		
		adminTabView = new Y.TabView({
			srcNode: '#soss-admin-tabs-container'
		}).render();
		
		updateClassList();
		Y.one('#inactive-class-checkbox').on('change', updateClassList);
		Y.one('#change-class-select').on('change', changeClass);
		Y.on('soss:class-change', updateClassList);
		Y.on('click', Y.soss.event.logout, '#logout-link');
		Y.all('.class-name').setContent(Y.soss.core.session.className);
		adminTabView.selectChild(2);
		
		Y.fire("soss:admin-ready");
	});
	
});
