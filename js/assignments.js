(function() {
	
	var Dom = YAHOO.util.Dom;
	var Evt = YAHOO.util.Event;
	var calendar, calendarDlg;
	
	var DELETE_CONFIRM_DIALOG_ID = "delete-confirm-dialog-assignment";
	var deleteConfirmDialog = null;
	var assignToDelete = null;
	
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
						{text:"Delete", handler:function(o){ this.hide(); deleteAssignment();} }
						]
				}
			);
			
			dlg.setHeader(title);
			dlg.setBody("Placeholder");
			dlg.render(document.body);
			deleteConfirmDialog = dlg;
		}
		message = "<p>About to delete assignment: " + assignToDelete + ".</p>";
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
			assignToDelete = rec.getData("name");
			showDeleteConfirmDialog();
		}
	};
	
	var deleteAssignment = function() {
		if( ! assignToDelete ) return;
		
		var query = "delete.php?t=assignment";
		query += "&name=" + YAHOO.soss.urlencode(assignToDelete);
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					if( result.ResponseCode == 200 ) {
						YAHOO.soss.showInfoDialog(result.Message);
						YAHOO.soss.event.onAssignmentChange.fire();
						assignToDelete = null;
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { 
					YAHOO.soss.showErrorDialog("Error accessing server."); },
				timeout:10000
	
			}, null );
	};
	
	var showCalendar = function() {
		if( !calendarDlg ) {
			var showBtn = Dom.get("soss-assignment-show-cal");
			var dateField = Dom.get("soss-admin-due-date");
			
			function resetHandler() {
			    // Reset the current calendar page to the select date, or 
			    // to today if nothing is selected.
			    var selDates = calendar.getSelectedDates();
			    var resetDate;
			
			    if (selDates.length > 0) {
			        resetDate = selDates[0];
			    } else {
			        resetDate = calendar.today;
			    }
			
			    calendar.cfg.setProperty("pagedate", resetDate);
			    calendar.render();
			}
			
			function clearHandler() {
				dateField.value = "";
				calendarDlg.hide();
			}
			
			calendarDlg = new YAHOO.widget.Dialog("container", {
			    visible:false,
			    context:[showBtn, "tl", "bl"],
			    buttons:[ {text:"Clear", handler: clearHandler },
			              {text:"Reset", handler: resetHandler, isDefault:true}, 
			              {text:"Close", handler: function() { calendarDlg.hide(); } }],
			    draggable:false,
			    close:true
			});
			calendarDlg.setHeader('Pick A Date');
			calendarDlg.setBody('<div id="cal"></div>');
			calendarDlg.render(document.body);
			
			// Hide Calendar if we click anywhere in the document other than the calendar
			Evt.on(document, "click", function(e) {
			    var el = Evt.getTarget(e);
			    var dialogEl = calendarDlg.element;
			    if (el != dialogEl && !Dom.isAncestor(dialogEl, el) && 
			    		el != showBtn && !Dom.isAncestor(showBtn, el) &&
			    		el != dateField && !Dom.isAncestor(dateField, el) ) {
			        calendarDlg.hide();
			    }
			});
			
			calendar = new YAHOO.widget.Calendar("cal", {iframe:false});
			calendar.render();
			
			calendar.selectEvent.subscribe( function () {
				if (calendar.getSelectedDates().length > 0) {
                    var selDate = calendar.getSelectedDates()[0];

                    // Pretty Date Output, using Calendar's Locale values: Friday, 8 February 2008
                    var dStr = selDate.getDate();
                    var mStr = calendar.cfg.getProperty("MONTHS_LONG")[selDate.getMonth()];
                    var yStr = selDate.getFullYear();
    
                    dateField.value =  dStr + " " + mStr + " " + yStr;
                } else {
                    dateField.value = "";
                }
                dialog.hide();
			});
		}
		
		if(! calendarDlg.cfg.visible ) {
			var seldate = calendar.getSelectedDates();
	
			if (seldate.length > 0) {
	        	// Set the pagedate to show the selected date if it exists
	        	calendar.cfg.setProperty("pagedate", seldate[0]);
	        	calendar.render();
	        }
			
			calendarDlg.show();
		}
	};
	
	var updateDataTable = function() {
		var dt = YAHOO.soss.assignmentsDataTable;
		
		var callback = {
			success : dt.onDataReturnReplaceRows,
			failure : dt.onDataReturnReplaceRows,
			scope : dt
		};

		dt.getDataSource().sendRequest('',callback);
	};
	
	var addAssignment = function () {
		var nameField = Dom.get("soss-admin-new-assignment-name");
		var ddateField = Dom.get("soss-admin-due-date");
		var hrSel = Dom.get("soss-assignment-hour-select");
		var minSel = Dom.get("soss-assignment-minute-select");
		var aname = YAHOO.lang.trim(nameField.value);
		var ddateTxt = ddateField.value;
		var hour = hrSel.options[hrSel.selectedIndex].value;
		var min = minSel.options[minSel.selectedIndex].value;
		
		var query = "insert.php?t=assignment";
		if( !aname ) {
			YAHOO.soss.showErrorDialog("Please select a name.");
			return;
		} else {
			query += "&aname=" + YAHOO.soss.urlencode(aname);
		}
		if( ddateTxt ) {
			var seldate = calendar.getSelectedDates()[0];
			seldate.setHours(hour);
			seldate.setMinutes(min);
			query += "&ddate=" +
			YAHOO.soss.urlencode(
					YAHOO.util.Date.format(seldate,{format:"%Y-%m-%d %H:%M:00"})
			);
		}
		
		YAHOO.util.Connect.asyncRequest('GET', query,
			{
				success: function(o) { 
					var result = YAHOO.soss.parseJSON(o.responseText);
					if( result.ResponseCode == 200 ) {
						nameField.value = "";
						ddateField.value = "";
						
						YAHOO.soss.ds.assignmentsDataSource.flushCache();
						YAHOO.soss.event.onAssignmentChange.fire();
					} else {
						YAHOO.soss.showErrorDialog("" + result.Message);
					}
				},
				failure: function(o) { },
				timeout:10000
	
			}, null );
		
	};
	
	var initUI = function() {
		var addButton = new YAHOO.widget.Button("soss-admin-new-assignment-button"); 
		addButton.on("click", addAssignment );
		
		var el = Dom.get("soss-assignment-hour-select");
		for( i = 0; i < 24; i++ ) {
			var disp = i;
			if( i < 10 ) disp = "0" + i;
			el.innerHTML += "<option value=\""+i+"\">"+disp+"</option>";
		}
		el.selectedIndex = 23;
		el = Dom.get("soss-assignment-minute-select");
		for( i = 0; i < 60; i+=5 ) {
			var disp = i;
			if( i < 10 ) disp = "0" + i;
			el.innerHTML += "<option value=\""+i+"\">"+disp+"</option>";
		}
		el.selectedIndex = 11;
		
		el = Dom.get("soss-admin-due-date");
		el.readOnly = true;
		Evt.addListener(el,"click", showCalendar );
		
		var calButton = new YAHOO.widget.Button("soss-assignment-show-cal"); 
		calButton.on("click", showCalendar );
		
		// Build the data table for the assignment list
		var columnDefs = [
		                  {
		                	  key:"name", 
		                	  label:'Name',
		                	  sortable:true,
		                	  resizeable:true, width:350
		                  },
		                  {
		                	  key:"ddate", label:"Due",
		                	  sortable:true,resizeable:true,
		                	  formatter:'date'
		                  },
		                  { key:"del", label:"",
		                	  sortable:false,resizeable:false,
		                	  formatter:YAHOO.soss.deleteButtonFormatter,
		                	  className:"delete-row-cell"}
		];
		
		var dt = new YAHOO.widget.DataTable(
				"soss-admin-assignment-table",
				columnDefs, YAHOO.soss.ds.assignmentsDataSource,
				{
					MSG_EMPTY: "No assignments",
					initialLoad: false,
					dateOptions:{format:'%m/%d/%Y %I:%M %p'}
				}
			);
		
		YAHOO.soss.assignmentsDataTable = dt;
		
		dt.subscribe("cellClickEvent", deleteHandler);
	};
	
	Evt.addListener(window, "load", initUI);
	YAHOO.soss.event.onAssignmentChange.subscribe(updateDataTable);
	YAHOO.soss.event.onDataReady.subscribe(updateDataTable);
})();