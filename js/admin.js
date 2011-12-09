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
				'soss-passwd-dialog': {path: 'soss-passwd-dialog.js', requires: ['panel', 'event', 'io-base', 'io-form']}
			}
		}	
	}
};

YUI(config).use('soss-core', 'tabview', 'soss-passwd-dialog', 'datatype-date-math', 'datatype-date-parse', 'io-form','panel','datasource-io', 'datatable', function(Y) {

	var changeClass = function(e) {
		
	};
	
	var updateClassList = function(e) {
		var cbox = Y.one('#inactive-class-checkbox');
		var select = Y.one('#change-class-select');
		select.setContent("<option>Loading...</option>");
		
		var buildSelect = function(id,resp,args) {
			var oData= resp.parsedResponse.Data;
			select.setContent( '<option value="__none__">[Select Class]</option>' );
			for( var i=0 ; i < oData.length ; i++) {
				select.append( '<option value="' + oData[i].id +
					'">'+ oData[i].name + " -- " +
					oData[i].term + ", " + oData[i].year + '</option>');
			}
		};
		
		var callback = { success : buildSelect };
		
		var url = "query.php?q=classes";
		if(cbox.checked) query += "&includeInactive=1";
		Y.io( url, { on: callback } );
	};
	
	Y.on("soss:ready", function(e) {
		Y.one('#soss-version').setContent(Y.soss.core.version);
		Y.all('.class-name').setContent(Y.soss.core.session.className);
		
		var tabview = new Y.TabView({
			srcNode: '#soss-admin-tabs-container'
		}).render();
		
		updateClassList();
		Y.one('#inactive-class-checkbox').on('change', updateClassList);
		Y.one('#change-class-select').on('change', changeClass);
	});
	
});

/*
(function() {
	
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event;
	var TAB_CONTAINER_ID = "soss-admin-tabs-container",
		STUDENTS_TAB_ID = "soss-admin-tab-3",
		CLASSES_TAB_ID = "soss-admin-tab-2",
		ASSIGNMENTS_TAB_ID = "soss-admin-tab-1",
		DOWNLOAD_TAB_ID = "soss-admin-tab-0",
		CHOOSE_CLASS_DIALOG_ID = "choose-class-dialog",
		CHOOSE_CLASS_SELECT_ID = "choose-class-dialog-select",
		SHOW_INACTIVE_CHECKBOX_ID = "choose-class-dialog-checkbox",
		CHANGE_CLASS_LINK_ID = "change-class-link",
		CHANGE_PASS_DLG_ID = "change-admin-pass-dialog",
		CHANGE_PASS_LINK = "change-pass-link",
		LOGOUT_LINK_ID = "logout-link",
		changePassDialog = null;
	
	var updateClassDialogSelect = function() {
		var cbox = Dom.get(SHOW_INACTIVE_CHECKBOX_ID);
		var select = Dom.get(CHOOSE_CLASS_SELECT_ID);
		select.innerHTML = "<option>Loading...</option>";
		
		var buildSelect = function(oRequest,oParsedResp,oPayload) {
			var oData= oParsedResp.results;
			var el = Dom.get(CHOOSE_CLASS_SELECT_ID);
			el.innerHTML = '<option value="__none__">[Select Class]</option>';
			for(i=0 ; i < oData.length ; i++) {
				el.innerHTML += '<option value="' + oData[i].id +
					'">'+ oData[i].name + " -- " +
					oData[i].term + ", " + oData[i].year + '</option>';
			}
		};
		
		var callback = {
				success : buildSelect,
				failure : function() { alert("failed to retrieve class info.");}
			};
		var query = "";
		if(cbox.checked) query += "&includeInactive=1";
		YAHOO.soss.ds.classesDataSource.sendRequest(query,callback);
	};
	
	YAHOO.soss.deleteButtonFormatter = function(el, oRecord, oColumn, oData) {
		el.innerHTML = "<img src=\"lib/yui/build/container/assets/blck16_1.gif\" />";
	};
	
	var showSelectClassDialog = function() {
		YAHOO.soss.chooseClassDialog.show();
		updateClassDialogSelect();
	};
	
	var initUI = function() {
		var myTabs = new YAHOO.widget.TabView();
		
		myTabs.addTab( new YAHOO.widget.Tab({
		    label: 'Download Files',
		    contentEl: Dom.get(DOWNLOAD_TAB_ID),
		    active: true
		}));
		myTabs.addTab( new YAHOO.widget.Tab({
		    label: 'Assignments',
		    contentEl: Dom.get(ASSIGNMENTS_TAB_ID)
		}));
		myTabs.addTab( new YAHOO.widget.Tab({
		    label: 'Students',
		    contentEl: Dom.get(STUDENTS_TAB_ID)
		}));
		myTabs.addTab( new YAHOO.widget.Tab({
		    label: 'Classes',
		    contentEl: Dom.get(CLASSES_TAB_ID)
		}));
		
		myTabs.appendTo(TAB_CONTAINER_ID);
		YAHOO.soss.adminTabView = myTabs;
		
		setupChooseClassDialog();
		setupChangePassDialog();
		
		Evt.addListener(CHANGE_CLASS_LINK_ID,"click",changeClassID);
		Evt.addListener(CHANGE_PASS_LINK, "click", showChangePassDialog);
		Evt.addListener(SHOW_INACTIVE_CHECKBOX_ID,"click",updateClassDialogSelect);
		Evt.addListener(LOGOUT_LINK_ID,"click",signOff);
	};
	
	var setupChooseClassDialog = function () { 
		var handleSubmit = function() { 
			if( Dom.get(CHOOSE_CLASS_SELECT_ID).selectedIndex == 0 ) {
				YAHOO.soss.showErrorDialog("Please select a class from the list.");
			} else {
				this.submit(); 
			}
		};
		var handleCancel = function() { this.hide(); };
		var showClassesTab = function() {
			YAHOO.soss.adminTabView.selectTab(3);
			this.hide();
		};
		
		// Instantiate the Dialog
		var dlg = new YAHOO.widget.Dialog(
				CHOOSE_CLASS_DIALOG_ID, 
					{ width : "40em",
					  fixedcenter : true,
					  visible : false, 
					  modal: true,
					  constraintoviewport : true,
					  draggable: false,
					  buttons : [ { text:"Select", handler:handleSubmit, isDefault:true },
								  { text:"Cancel", handler:handleCancel },
								  { text:"Create New...", handler:showClassesTab } ]
					 } );
		dlg.render();
		
		var handleSuccess = function(o) {
			var result = YAHOO.soss.parseJSON(o.responseText);
			if( result.ResponseCode != 200 ) {
				YAHOO.soss.showErrorDialog(result.Message);
			} else {
				YAHOO.soss.loadCoreInfo();
			}
		};
		
		var handleFailure = function() {
			YAHOO.soss.showErrorDialog("Unable to set class on server.");
		};
		
		dlg.callback = { success: handleSuccess, failure:handleFailure };
		YAHOO.soss.chooseClassDialog = dlg;
	};
	
	var setupChangePassDialog = function() {
		var handleSubmit = function() { this.submit(); },
		    handleCancel = function() { this.hide(); };
		
		// Instantiate the Dialog
		var dlg = new YAHOO.widget.Dialog(
				CHANGE_PASS_DLG_ID, 
					{ width : "40em",
					  fixedcenter : true,
					  visible : false, 
					  modal: true,
					  constraintoviewport : true,
					  draggable: false,
					  buttons : [ { text:"Change", handler:handleSubmit, isDefault:true },
								  { text:"Cancel", handler:handleCancel } ]
					 } );
		dlg.render();
		
		var handleSuccess = function(o) {
			var result = YAHOO.soss.parseJSON(o.responseText);
			if( result.ResponseCode != 200 ) {
				YAHOO.soss.showErrorDialog(result.Message);
			} else {
				YAHOO.soss.showInfoDialog("Password Successfully Changed");
			}
		},
		handleFailure = function() {
			YAHOO.soss.showErrorDialog("Unable to contact server.");
		};
		
		dlg.callback = { success: handleSuccess, failure:handleFailure };
		changePassDialog = dlg;
	};
	
	var showChangePassDialog = function(e) {
		Evt.preventDefault(e);
		changePassDialog.show();
	};
	
	var changeClassID = function(e) {
		Evt.preventDefault(e);
		showSelectClassDialog();
	};
	
	var signOff = function(e) {
		Evt.preventDefault(e);
		var callback = {
			success: function() {
				window.open("faculty_login.html","_self");
			},
			failure: function() { 
				alert("Failed to contact server.");
				window.open("faculty_login.html","_self");
			}
		};
		YAHOO.util.Connect.asyncRequest('GET', 'auth.php?a=logout', callback);
	};
	
	var checkClassID = function() {
		if( !YAHOO.soss.classid || YAHOO.soss.classid < 0 ) {
			showSelectClassDialog();
			YAHOO.soss.adminTabView.selectTab(3);
			YAHOO.soss.adminTabView.getTab(0).set("disabled",true);
			YAHOO.soss.adminTabView.getTab(1).set("disabled",true);
			YAHOO.soss.adminTabView.getTab(2).set("disabled",true);
		} else {
			YAHOO.soss.adminTabView.getTab(0).set("disabled",false);
			YAHOO.soss.adminTabView.getTab(1).set("disabled",false);
			YAHOO.soss.adminTabView.getTab(2).set("disabled",false);
			YAHOO.soss.adminTabView.selectTab(1);
		}
	};
	
	Evt.onDOMReady(initUI);
	YAHOO.soss.event.onDataReady.subscribe(checkClassID);
})();*/