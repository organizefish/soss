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

/*
(function() {
	
	YAHOO.namespace("soss");
	YAHOO.namespace("soss.ds");
	YAHOO.namespace("soss.event");
	
	var SOSS_ERROR_DIALOG_ID = "soss-error-dialog";
	YAHOO.soss.errorDialog = null;
	
	var SOSS_INFO_DIALOG_ID = "soss-info-dialog";
	YAHOO.soss.infoDialog = null;
	
	var USERNAME_SPAN_ID = "header-username",
		CLASS_NAME_SPAN_ID = "user-class-name",
                CHANGE_PASS_SPAN_ID = "change-pass-span",
                VERSION_SPAN_ID = "soss-version";
	
	var Dom = YAHOO.util.Dom,
		Evt = YAHOO.util.Event;
	
	YAHOO.soss.classid = null;
	
	YAHOO.soss.showErrorDialog = function(message, title) {
		var dlg = YAHOO.soss.errorDialog;
		if(!title) title = "Error";
		
		if( ! dlg ) {
			dlg = new YAHOO.widget.SimpleDialog(
				SOSS_ERROR_DIALOG_ID,
				{
					width:"30em",
					fixedcenter:true,
					visible:false,
					draggable:false,
					close:false,
					icon:YAHOO.widget.SimpleDialog.ICON_BLOCK,
					constraintoviewport:true,
					modal:true,
					buttons:[
						{text:"Ok", handler:function(o){ this.hide(); } , isDefault:true},
						]
				}
			);
			dlg.setHeader(title);
			dlg.setBody("Placeholder");
			dlg.render(document.body);
			YAHOO.soss.errorDialog = dlg;
		}
		
		dlg.setHeader(title);
		dlg.setBody(message);
		dlg.cfg.setProperty('icon', YAHOO.widget.SimpleDialog.ICON_BLOCK);
		dlg.bringToTop();
		dlg.show();
	};
	
	YAHOO.soss.showInfoDialog = function(message, title) {
		var dlg = YAHOO.soss.infoDialog;
		if(!title) title = "Info";
		
		if( ! dlg ) {
			dlg = new YAHOO.widget.SimpleDialog(
				SOSS_INFO_DIALOG_ID,
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
						{text:"Ok", handler:function(o){ this.hide(); } , isDefault:true},
						]
				}
			);
			dlg.setHeader(title);
			dlg.setBody("Placeholder");
			dlg.render(document.body);
			YAHOO.soss.infoDialog = dlg;
		}
		
		dlg.setHeader(title);
		dlg.setBody(message);
		dlg.cfg.setProperty('icon', YAHOO.widget.SimpleDialog.ICON_INFO);
		dlg.bringToTop();
		dlg.show();
	};
	
	YAHOO.soss.urlencode = function(s) {
		return encodeURIComponent(s);
	};
	
	YAHOO.soss.parseJSON = function( text ) {
		var result = null;
		
		try {
			result = YAHOO.lang.JSON.parse(text);
		} catch (e) {
			alert("Failed to parse JSON, contact administrator: " + 
					text);
		}
		
		// Check for "access denied".   If so, redirect to login.
		if(result.ResponseCode == 110 ) {
			window.open("login.html", "_self");
		}
		
		return result;
	};
	
	YAHOO.widget.DataTable.Formatter['sossDateFormat'] = function(elCell, oRecord, oColumn, oData) {
		
		if(oData instanceof Date) {
			
			elCell.innerHTML = YAHOO.util.Date.format(oData,{format:'%m/%d/%Y %I:%M %p'});
			var dueDate = oRecord.getData('ddate');
	
			var DM = YAHOO.widget.DateMath;
			
			// Make all dates older than due date on a red background
			if (dueDate instanceof Date && DM.before(dueDate,oData)) {
				YAHOO.util.Dom.addClass(elCell,'late-submission');
			} else {
				YAHOO.util.Dom.removeClass(elCell,'late-submission');
			}
	
		} else {
			elCell.innerHTML = YAHOO.lang.isValue(oData) ? oData : '??';
		}
	};
	
	
	YAHOO.util.DataSource.Parser['sqlDate'] = function (oData) {
		if( oData == null ) return null;
			var parts = oData.split(' ');
			var datePart = parts[0].split('-');
			if (parts.length > 1) {
				var timePart = parts[1].split(':');
				return new Date(datePart[0],datePart[1]-1,datePart[2],timePart[0],timePart[1],timePart[2]);
			} else {
				return new Date(datePart[0],datePart[1]-1,datePart[2]);
			}
		};
		
	YAHOO.util.DataSource.Parser['YN'] = function(oData) {
		if(oData == 'Y') return true;
		if(oData == 'N') return false;
		return null;
	};
	
	YAHOO.soss.ds.preLoad = function (oRequest, oFullResponse, oCallback) {
	    if (oFullResponse.ResponseCode) {
	        if (oFullResponse.ResponseCode < 200) {
	        	
	        	// Check for "access denied".   If so, redirect to login.
	    		if(oFullResponse.ResponseCode == 110 ) {
	    			window.open("login.html", "_self");
	    		}
	    		
	        }
	    } else {
	        alert(oFullResponse + "" + oFullResponse.ResponseCode);
	    }
	    return oFullResponse;
	};
	
	YAHOO.soss.loadCoreInfo = function() {
		YAHOO.util.Connect.asyncRequest('GET', "query.php?q=getCoreInfo",
			{
				success: function(o) {
					var result = YAHOO.soss.parseJSON(o.responseText);
					
					if( result.ResponseCode == 200 ) {
						var el = Dom.get(USERNAME_SPAN_ID);
						el.innerHTML = result.Data.uname;

						el = Dom.get(CLASS_NAME_SPAN_ID);
						el.innerHTML = result.Data.className;

                                                if( result.Data.useLdap ) {
                                                     Dom.setStyle(CHANGE_PASS_SPAN_ID, 'display', 'none');
                                                }
						
                                                el = Dom.get(VERSION_SPAN_ID);
                                                el.innerHTML = result.Data.version;

						YAHOO.soss.classid = result.Data.classid;
						
						// The core data is now available to the 
						// UI, notify the listeners.
						YAHOO.soss.event.onDataReady.fire();
						
					} else if( result.ResponseCode == 110 ) {
						window.open("login.html", "_self");
					} else {
						alert("Error loading default information: " + 
							result.Message);
					}
				},
				failure: function(o) { },
				timeout:10000
			}, null );
	};
	
	var initHandler = function() { YAHOO.soss.loadCoreInfo(); };
	
	YAHOO.soss.ds.studentsDataSource = new YAHOO.util.XHRDataSource("query.php?q=students");
	YAHOO.soss.ds.studentsDataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
	YAHOO.soss.ds.studentsDataSource.doBeforeParseData = YAHOO.soss.ds.preLoad;
	YAHOO.soss.ds.studentsDataSource.responseSchema = {
			resultsList: "Data",
			fields: [ "uname", "email", "lname", "fname", {key:"grader",parser:'YN'} ]
	};
	
	YAHOO.soss.ds.classesDataSource = new YAHOO.util.XHRDataSource("query.php?q=classes");
	YAHOO.soss.ds.classesDataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
	YAHOO.soss.ds.classesDataSource.doBeforeParseData = YAHOO.soss.ds.preLoad;
	YAHOO.soss.ds.classesDataSource.responseSchema = {
			resultsList: "Data",
			fields: [ "id", "name", "term", "year", {key:"active",parser:'YN'} ]
	};
	
	YAHOO.soss.ds.assignmentsDataSource = new YAHOO.util.XHRDataSource("query.php?q=assignments");
	YAHOO.soss.ds.assignmentsDataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
	YAHOO.soss.ds.assignmentsDataSource.doBeforeParseData = YAHOO.soss.ds.preLoad;
	YAHOO.soss.ds.assignmentsDataSource.responseSchema = {
			resultsList: "Data",
			fields: [ "name", {key:"ddate", parser:"sqlDate"} ]
	};
	
	YAHOO.soss.ds.submissionsDataSource = new YAHOO.util.XHRDataSource("query.php?q=submissions");
	YAHOO.soss.ds.submissionsDataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
	YAHOO.soss.ds.submissionsDataSource.doBeforeParseData = YAHOO.soss.ds.preLoad;
	YAHOO.soss.ds.submissionsDataSource.responseSchema = {
			resultsList: "Data",
			fields: [
				"uname", "name", "aname",
				{key:"ddate", parser:"sqlDate"},
				{key:"sdate", parser:"sqlDate"},
				"id"
			]
		};
	
	YAHOO.soss.event.onDataReady = new YAHOO.util.CustomEvent("onDataReady");
	YAHOO.soss.event.onStudentChange = new YAHOO.util.CustomEvent("onStudentChange");
	YAHOO.soss.event.onAssignmentChange = new YAHOO.util.CustomEvent("onAssignmentChange");
	YAHOO.soss.event.onClassChange = new YAHOO.util.CustomEvent("onClassChange");
	
	Evt.addListener(window, "load", initHandler);
})();
*/