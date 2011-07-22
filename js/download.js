(function() {
	
	var Dom = YAHOO.util.Dom;
	var Event = YAHOO.util.Event;
	var ASSIGNMENT_SELECT_ID = "soss-admin-assignment-select",
		STUDENT_SELECT_ID = "soss-admin-student-select";
	
	var updateSubmissionList = function() {
		YAHOO.soss.submissionDataTable.set("MSG_EMPTY", "No submissions found.", false);
		var query = "";
		var sel = Dom.get(STUDENT_SELECT_ID);
		var student = sel.options[ sel.selectedIndex ].value;
		if( sel.selectedIndex != 0 ) {
			query += "&student=" + YAHOO.soss.urlencode(student);
		}
		
		sel = Dom.get(ASSIGNMENT_SELECT_ID);
		var assign = sel.options[ sel.selectedIndex ].value;
		if( sel.selectedIndex != 0 ) {
			query += "&assignment=" + YAHOO.soss.urlencode(assign);
		}
		
		// Sends a request to the DataSource for more data
		var oCallback = {
		    success : YAHOO.soss.submissionDataTable.onDataReturnReplaceRows,
		    failure : YAHOO.soss.submissionDataTable.onDataReturnReplaceRows,
		    scope : YAHOO.soss.submissionDataTable
		};
		YAHOO.soss.submissionDataTable.getDataSource().sendRequest(query, oCallback);
	};
	
	var formatSelectCheckbox = function(el, oRecord, oColumn, oData) {
		var bChecked = oData;
		var fileID = oRecord.getData("id");
		bChecked = (bChecked) ? " checked=\"checked\"" : "";
		el.innerHTML = "<input type=\"checkbox\"" + 
			" name=\"file_list[]\"" +
			" value=\"" + fileID + "\"" + bChecked + 
			" class=\"" + YAHOO.widget.DataTable.CLASS_CHECKBOX +
			"\" />";
	};
	
	var doDownload = function() {
		var form = Dom.get("soss-download-form");
		form.submit();
	};
	
	var initUI = function() {
		
		var listButton = new YAHOO.widget.Button("soss-admin-list-button"); 
		listButton.on("click", updateSubmissionList);
		
		var dlButton = new YAHOO.widget.Button("download-button"); 
		dlButton.on("click", doDownload);
		
		// Build the data table for the download list
		var columnDefs = [
		                  {
		                	  key:"ckbox", 
		                	  label:'<input id="dl-select-all" type="checkbox" />',
		                	  sortable:false,
		                	  resizeable:false,
		                	  formatter:formatSelectCheckbox
		                  },
		                  {
		                	  key:"uname", label:"Username",
		                	  sortable:true,resizeable:true
		                  },
		                  {
		                	  key:"name", label:"Name",
		                	  sortable:true,resizeable:true
		                  },
		                  {
		                	  key:"aname", label:"Assignment",
		                	  sortable:true,resizeable:true
		                  },
		                  {
		                	  key:"ddate", label:"Due",
		                	  formatter: 'date',
		                	  sortable:true
		                  },
		                  {
		                	  key:"sdate", label:"Submitted",
		                	  formatter:'sossDateFormat',
		                	  sortable:true
		                  }
		];
		
		var submissionDataTable = new YAHOO.widget.DataTable(
				"soss-admin-submission-table",
				columnDefs, YAHOO.soss.ds.submissionsDataSource,
				{
					MSG_EMPTY: "Select options above, and press \"List\".",
					initialLoad: false,
					dateOptions:{format:'%m/%d/%Y %I:%M %p'}
				}
			);
		
		submissionDataTable.subscribe("rowMouseoverEvent", submissionDataTable.onEventHighlightRow); 
		submissionDataTable.subscribe("rowMouseoutEvent", submissionDataTable.onEventUnhighlightRow); 
		submissionDataTable.subscribe("rowClickEvent", function(oArgs) {
			var record = this.getRecord(oArgs.target);
			var checked = record.getData("ckbox");
			var newState = !checked;
			
			this.updateCell(this.getRecord(oArgs.target),"ckbox",newState);	
			if( ! newState ) {
				var el = Dom.get("dl-select-all");
				if( el.checked ) el.checked = false;
			}
		});
	
		YAHOO.soss.submissionDataTable = submissionDataTable;
		wireSelectAllCB();  // Do this after the table is set up
	};
	
	var wireSelectAllCB = function() {
		Event.addListener("dl-select-all" , "click", function(e) {
			var dt = YAHOO.soss.submissionDataTable;
			var el = dt.getTrEl(0);  // First row
			while( el != null ) {
				var record = dt.getRecord(el);
				if( record.getData("ckbox") != e.target.checked ) {
					dt.updateCell(record,"ckbox",e.target.checked);
				}
				el = dt.getNextTrEl(el);
			}
		});
	};
	
	var updateAssignmentSelect = function() {
		var buildSelect = function(oRequest,oParsedResp,oPayload) {
			var oData= oParsedResp.results;
			var el = Dom.get(ASSIGNMENT_SELECT_ID);
			el.innerHTML = '<option value="__all__">[All]</option>';
			for(i=0 ; i < oData.length ; i++) {
				el.innerHTML += '<option value="' + oData[i].name +
					'">'+ oData[i].name+ '</option>';
			}
		};
		
		// Sends a request to the DataSource for data
		var oCallback = {
		    success : buildSelect,
		    failure : function() {alert("Failed to retrieve assignment list.");}
		};
		YAHOO.soss.ds.assignmentsDataSource.sendRequest("", oCallback);
	};
	
	var updateStudentSelect = function(oData) {
		
		var buildSelect = function(oRequest,oParsedResp,oPayload) {
			var oData = oParsedResp.results;
			var el = Dom.get(STUDENT_SELECT_ID);
			el.innerHTML = '<option value="__all__">[All]</option>';
			for(i=0 ;i < oData.length ; i++) {
				el.innerHTML += '<option value="' + oData[i].uname +
					'">'+ oData[i].uname + '</option>';
			}
		};

		oCallback = {
		    success : buildSelect,
		    failure : function() {alert("Failed to retrieve student list.");}
		};
		YAHOO.soss.ds.studentsDataSource.sendRequest("", oCallback);
	};
	 
	var updateSelects = function () {
		// If classid is not set yet, then do nothing.
		if( YAHOO.soss.classid < 0 || !(YAHOO.soss.classid) ) {
			return;
		}
		
		var dt = YAHOO.soss.submissionDataTable;
		dt.set("MSG_EMPTY", 
				"Select options above, and press \"List\".", false);
		var nRows = dt.getRecordSet().getLength();
		dt.deleteRows(0,nRows);
		
		updateStudentSelect();
		updateAssignmentSelect();
	};
	
	Event.addListener(window, "load", initUI);
	YAHOO.soss.event.onDataReady.subscribe(updateSelects);
	YAHOO.soss.event.onAssignmentChange.subscribe(updateAssignmentSelect);
	YAHOO.soss.event.onStudentChange.subscribe(updateStudentSelect);
})();