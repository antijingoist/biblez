/*### BEGIN LICENSE
# Copyright (C) 2011 Stephan Tetzel <info@zefanjas.de>
# This program is free software: you can redistribute it and/or modify it 
# under the terms of the GNU General Public License version 3, as published 
# by the Free Software Foundation.
# 
# This program is distributed in the hope that it will be useful, but 
# WITHOUT ANY WARRANTY; without even the implied warranties of 
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR 
# PURPOSE.  See the GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License along 
# with this program.  If not, see <http://www.gnu.org/licenses/>.
### END LICENSE*/

var biblezTools = {
    createDB: function() {
		try {
			this.db = openDatabase('ext:settings', '', 'BibleZ Settings Data', 200000);
			console.log("Created/Opened database")
		} catch (e) {
			console.log("ERROR", e);		
		}
		
		switch (this.db.version) {
			case '':
				console.log("Create Tables...");
                this.dbCreateTables("1");
			break;
			case "1":
				console.log("Update Tables to 2");
                //this.dbCreateTables("2");
			break;
		}
	},
	
	dbCreateTables: function(version) {
		try {
			var sqlNote = "CREATE TABLE IF NOT EXISTS notes (bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, note TEXT, title TEXT, folder TEXT, tags TEXT);";
			var sqlBook = "CREATE TABLE IF NOT EXISTS bookmarks (bnumber INTEGER, cnumber INTEGER, vnumber INTEGER, title TEXT, folder TEXT, tags TEXT);";
		    this.db.changeVersion('', version,
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sqlNote, [], 
						enyo.bind(this, function () {console.log("SUCCESS: Created notes table");}),
						enyo.bind(this,this.errorHandler)
					);
					
					transaction.executeSql(sqlBook, [], 
						enyo.bind(this, function () {console.log("SUCCESS: Created bookmarks table");}),
						enyo.bind(this,this.errorHandler)
					); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
    
    prepareModules: function (modules, inCallback) {
        //console.log(this.db);
        try {
			var sql = 'DROP TABLE IF EXISTS modules;'
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [], 
					enyo.bind(this, function () {
                        console.log("SUCCESS: Dropped modules table");
                        //this.importModuleData(modules);
                        try {
                            var sql = 'CREATE TABLE IF NOT EXISTS modules (lang TEXT, modType TEXT, modName TEXT, descr TEXT, source TEXT);'
                            this.db.transaction( 
                                enyo.bind(this,(function (transaction) { 
                                    transaction.executeSql(sql, [], 
                                    enyo.bind(this, function () {
                                        console.log("SUCCESS: Created modules table");
										this.importModuleData(modules, inCallback);
                                    }),
                                    enyo.bind(this,this.errorHandler)); 
                                }))
                            );
                        } catch (e) {
                            console.log("ERROR", e);
                        }
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
    },
    
    importModuleData: function(modules, inCallback)  {
        console.log("Reading Module Data...");
		var z = 0;
        try {
			var sql = "";
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) {
                    sql = "INSERT INTO modules (lang, modType, modName, descr, source) VALUES (?,?,?,?,?)";
					for(var i=0; i<modules.length; i++) {
						if(modules[i].datapath) {
							transaction.executeSql(sql, [modules[i].lang, modules[i].datapath.split("/")[2], modules[i].name, modules[i].description, "crosswire"], 
							enyo.bind(this, function () {
								//console.log("SUCCESS: Insert Module " + z);
								z++;
								if (z == modules.length) {
									inCallback();
								}
							}),
							enyo.bind(this,this.errorHandler));
						} else {
							z++;
						}
					}
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
    },
	
	getLang: function (source, inCallback) {
		var lang = [];
		try {
			var sql = 'SELECT lang FROM modules ORDER BY lang ASC;'
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [], 
					enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
							if (results.rows.item(j).lang !== "undefined") {
								if (j == 0) {
									lang.push(results.rows.item(j).lang);
								} else if (results.rows.item(j).lang !== results.rows.item(j-1).lang) {
									lang.push(results.rows.item(j).lang);
								}
							}
						}
						inCallback(lang);
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
	
	getModules: function (lang, inCallback) {
		var modules = [];
		try {
			var sql = "SELECT * FROM modules WHERE lang = '" + lang + "' AND modType = 'texts' ORDER BY modType, modName ASC;"
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [], 
					enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
							modules.push({"lang": results.rows.item(j).lang, "modName": results.rows.item(j).modName, "modType": results.rows.item(j).modType, "descr": results.rows.item(j).descr});
						}
						inCallback(modules);
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
	
	addNote: function (bnumber, cnumber, vnumber, noteText, title, folder, tags, inCallback) {
		enyo.log(bnumber, cnumber, vnumber, noteText, title, folder, tags);
		try {
			var sql = "INSERT INTO notes (bnumber, cnumber, vnumber, note, title, folder, tags) VALUES (?,?,?,?,?,?,?)";
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [bnumber, cnumber, vnumber, noteText, title, folder, tags], 
					enyo.bind(this, function () {
                        console.log("Successfully inserted note!");
						inCallback();
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
	
	getNotes: function(bnumber, cnumber, inCallback) {
		//enyo.log(bnumber, cnumber);
		var notes = [];
		try {
			var sql = "SELECT * FROM notes WHERE bnumber = '" + bnumber + "' AND cnumber = '" + cnumber + "' ORDER BY vnumber ASC;"
		    //console.log(sql);
			//var sql = "SELECT * FROM notes;";
			this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [], 
					enyo.bind(this, function (transaction, results) {
                        for (var j=0; j<results.rows.length; j++) {
							notes.push({"bnumber": results.rows.item(j).bnumber, "cnumber": results.rows.item(j).cnumber, "vnumber": results.rows.item(j).vnumber, "note": results.rows.item(j).note, "title": results.rows.item(j).title, "folder": results.rows.item(j).folder, "tags": results.rows.item(j).tags});
						}
						inCallback(notes);
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
	
	errorHandler: function (transaction, error) {
		console.log("ERROR", error.message);
	},
	
	logDB: function() {
		//console.log(this.db);
		try {
			var sql = 'SELECT * FROM modules;'
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sql, [], 
					enyo.bind(this, function (transaction, results) {
                        console.log(results.rows.item(1));
					}),
                    enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		} catch (e) {
			console.log("ERROR", e);
		}
	},
};