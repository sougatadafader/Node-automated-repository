var mongoose = require('mongoose')
var mongo = require('mongodb');


module.exports = function (app,url,useDb) {

	function createUniqueId(){
		const uuidv4 = require('uuid/v4');
		return uuidv4(); 

	}

	function createTable(req, res) {
		
		var MongoClient = require('mongodb').MongoClient;
		
		MongoClient.connect(url, function(err, db) {
  			if (err) throw err;
  			var dbo = db.db(useDb);
  		 	dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
        		console.log(collectionNames);
        		 var array= collectionNames.filter( collec => collec.name===req.params['table'])
        		 var body = req.body;
        		 if (body['id'] == undefined){
        		 	body['_id'] = createUniqueId();
        		 }
        		 else{
        		 	body['_id'] = body['id'].toString();
        		 }
        		 console.log(body)
				if(array.length ===0)
        		{
        			var itemSchema = new mongoose.Schema({}, { strict: false,  _id: false , collection: req.params['table'] });
					var Item = mongoose.model(req.params['table'], itemSchema);
					var item = new Item(body);
					item.save();
					res.send(item);
        		}
        		else{
        			console.log("collection Exists");
        			console.log(JSON.stringify(body));
        			const collection = dbo.collection(req.params['table']);
        			collection.insert(body);
        			res.send(body);
        			return;
        		}
    		});
		});
	}



	function findAllTables(req, res) {
		
		var MongoClient = require('mongodb').MongoClient;
		var result=[];
		MongoClient.connect(url, function(err, db) {
  			if (err) throw err;
  			var dbo = db.db(useDb);
  		 	dbo.listCollections().toArray(function (err, collectionNames) {
      			for(item in collectionNames)
      			{
      				result.push(item)
      			}
      			res.send(collectionNames);
    		});
		});
	}


	function findTable(req,res) {
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
        		console.log(collectionNames);
        		 var array= collectionNames.filter( collec => collec.name===req.params['table'])
        		 var body = req.body;

				if(array.length ===0)
        		{
        			res.send(null);
        		}
        		else{
        			var queryKeys = Object.keys(req.query);
        			if(queryKeys.length == 0)
        			{
        				dbo.collection(req.params['table']).find({}).toArray(function(err, result) {
    					if (err) throw err;
    					console.log(result);
    					db.close();
    					res.send(result);
  						});
        			}
        			else
        			{
        				findByPredicates(req,res);
        			}
        		}	
			});

		});
	}

	function findTableRecord(req,res) {
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
        		 console.log(collectionNames);
        		 var array= collectionNames.filter( collec => collec.name===req.params['table'])
        		 var body = req.body;

				if(array.length ===0)
	        		{
	        			res.send(null);
	        		}
        		else{
	  				var query = {"_id": req.params['id']};
	        			dbo.collection(req.params['table']).find(query).toArray(function(err, result) {
	    				if (err) throw err;
	    				console.log(result);  			
	    				db.close();
	    				res.send(result);
	  					});
        		}
			});
  	});

	}

	function findByPredicates(req,res){
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db(useDb);
  			var keys = Object.keys(req.query);
  			var values = Object.values(req.query);
  			var ret = '';
  			var queryObj = {};
  			var operatorIndex = {'>':'$gt','>=':'$gte','<':'$lt','<=':'$lte','!=':'$ne'};
  			for(var i=0;i<keys.length;i++)
  			{
  				var key = keys[i];
  				var param = key;
  				var operator = '=';
  				var value = values[i];
  				if(key.indexOf('>') >= 0)
  				{
  					operator = '>=';
  					var spArr = key.split('>');
  					value = values[i];
  					if( spArr[1] != '' )
  					{
  						operator = '>';
  						value = spArr[1];
  					}
  					param = spArr[0];
  				}
  				else if(key.indexOf('<') >= 0)
  				{
  					var operator = '<=';
  					var spArr = key.split('<');
  					var value = values[i];
  					if( spArr[1] != '' )
  					{
  						operator = '<';
  						value = spArr[1];
  					}
  					param = spArr[0];
  				}
  				else if(key.indexOf('!') >= 0)
  				{
  					var operator = '!=';
  					var spArr = key.split('!');
  					var value = values[i];
  					param = spArr[0];
  				}
  				ret+=param+' '+operator+' '+value+"\n";
  				if(value.indexOf("'") >= 0)
  				{
  					value = value.replace(/'/g,"");
  				}
  				else
  				{
  					value = parseInt(value);
  				}
  				if( operator == '=' )
  				{
  					queryObj[param] = value;
  				}
  				else
  				{
  					if(queryObj[param] == null)
  					{
  						queryObj[param] = {};
  					}
  					queryObj[param][operatorIndex[operator]] = value;
  				}
  			}
  			console.log(ret);
  			console.log(queryObj);
  			dbo.collection(req.params['table']).find(queryObj).toArray(function(err,result){
  				if(err) throw err;
  				res.send(result);
  			});
		});
	}

	function twoTablePredicates(queryObj,tableName,req,res){
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
  			var dbo = db.db(useDb);
  			var keys = Object.keys(req.query);
  			var values = Object.values(req.query);
  			var ret = '';
  			//var queryObj = {};
  			var operatorIndex = {'>':'$gt','>=':'$gte','<':'$lt','<=':'$lte','!=':'$ne'};
  			for(var i=0;i<keys.length;i++)
  			{
  				var key = keys[i];
  				var param = key;
  				var operator = '=';
  				var value = values[i];
  				if(key.indexOf('>') >= 0)
  				{
  					operator = '>=';
  					var spArr = key.split('>');
  					value = values[i];
  					if( spArr[1] != '' )
  					{
  						operator = '>';
  						value = spArr[1];
  					}
  					param = spArr[0];
  				}
  				else if(key.indexOf('<') >= 0)
  				{
  					var operator = '<=';
  					var spArr = key.split('<');
  					var value = values[i];
  					if( spArr[1] != '' )
  					{
  						operator = '<';
  						value = spArr[1];
  					}
  					param = spArr[0];
  				}
  				else if(key.indexOf('!') >= 0)
  				{
  					var operator = '!=';
  					var spArr = key.split('!');
  					var value = values[i];
  					param = spArr[0];
  				}
  				ret+=param+' '+operator+' '+value+"\n";
  				if(value.indexOf("'") >= 0)
  				{
  					value = value.replace(/'/g,"");
  				}
  				else
  				{
  					value = parseInt(value);
  				}
  				if( operator == '=' )
  				{
  					queryObj[param] = value;
  				}
  				else
  				{
  					if(queryObj[param] == null)
  					{
  						queryObj[param] = {};
  					}
  					queryObj[param][operatorIndex[operator]] = value;
  				}
  			}
  			console.log(ret);
  			console.log(queryObj);
  			dbo.collection(tableName).find(queryObj).toArray(function(err,result){
  				if(err) throw err;
  				res.send(result);
  			});
		});
	}


	function updateTableRecord(req,res) {
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
        		 console.log(collectionNames);
        		 var array= collectionNames.filter( collec => collec.name===req.params['table'])
        		 var body = req.body;

				if(array.length ===0)
	        		{

	        			res.send(null);
	        		}
        		else{
	  				var query = {"_id": req.params['id']};
	  				var newvalues = { $set: body};
	        			dbo.collection(req.params['table']).updateOne(query, newvalues, function(err, result) {
	        			console.log(JSON.stringify(result));
	        			var  val = result['result']['nModified'];
	        			if(val === 0)
	        			{

	        				res.send(null);
	        			}
	        			dbo.collection(req.params['table']).find(query).toArray(function(err, result) {
	    				if (err) throw err;
	    				console.log(result);  			
	    				db.close();
	    				res.send(result);
	  					});
	    				console.log("1 document updated"); 	
	    						
	  					});			
        		}
			});
  	});

	}


	function deleteTableRecord(req,res) {
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
        		 console.log(collectionNames);
        		 var array= collectionNames.filter( collec => collec.name===req.params['table'])
        		 var body = req.body;

				if(array.length === 0)
	        		{
	        			res.send(null);
	        		}
        		else{
	  				var query = {"_id": req.params['id']};
	        			dbo.collection(req.params['table']).deleteOne(query, function(err, obj) {
	    				if (err) throw err;
	    				console.log(obj);
	    				if(obj == null){
	    					res.send(null);
	    				}
	    				console.log(obj);
	    				res.send(" 1 document deleted")			
	    				db.close();
	  					});
        		}
			});
  	});

	}

	function deleteTable(req,res) {
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		var array= collectionNames.filter( collec => collec.name===req.params['table'])
  		if(array.length === 0)
	     {
	       res.send(null);
	     }
        else{
  		dbo.collection(req.params['table']).drop(function(err, ok) {
    	if (err) throw err;
    	if (ok) console.log("Collection deleted");
	    res.send("Collection deleted")			
	    db.close();
	  	});
  	}
    });
	}

	 function getMappingTables(req,resp){
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var dbo = db.db(useDb);
		  var tab = req.params['table1'];
		  var tab2 = req.params['table2'];
		  var mappingTab = '';
		  var mappingTab1 =  req.params['table1'] + "_" + req.params['table2'];
	      var mappingTab2 = req.params['table2'] + "_" + req.params['table1'];
	      dbo.listCollections().toArray(function (err, collectionNames) {
      			if (err) {
        			console.log(err);
        			return;
      			}
	      var array= collectionNames.filter( collec => collec.name=== mappingTab1)
	       if(array.length > 0){
	        	mappingTab = mappingTab1;
	        }
	       var array2= collectionNames.filter( collec => collec.name=== mappingTab2)
	        if(array2.length > 0){
	        	mappingTab = mappingTab2;
	        }
	        var query = {[tab]: req.params['id']};
	        console.log(query);
	        dbo.collection(mappingTab).find(query).toArray( function(err, result) {
	    	if (err) throw err;
	    	var arr = result.map(value => value[tab2])
	    	console.log(arr);
	    	var resultArray= [];
	    	var count =0;
	    	var query = {"_id":{$in:arr}};
	    	var queryKeys = Object.keys(req.query);
	    	if(queryKeys.length == 0)
	    	{
	    		dbo.collection(tab2).find(query).toArray(function(err,data){
	    			resp.send(data);
	    		});
	    	}
	    	else
	    	{
	    		twoTablePredicates(query,tab2,req,resp);
	    	}	
			});
  			});
    	});
	    }
	

	function createMappingTable2(req, res) {
			var MongoClient = require('mongodb').MongoClient;
			MongoClient.connect(url, function(err, db) {
	  			if (err) throw err;
	  			var dbo = db.db(useDb);
	  		 	dbo.listCollections().toArray(function (err, collectionNames) {
	      			if (err) {
	        			console.log(err);
	        			return;
	      			}
	        		var existingTable1 = false;
	        		var existingTable2 = false;
	        		var table1 = collectionNames.filter( collec => collec.name=== req.params['table1'])
	        		if (table1.length > 0) {
	        			existingTable1 = true;
	        		}
	        		var table2 = collectionNames.filter( collec => collec.name=== req.params['table2'])
	        		if (table2.length > 0) {
	        			existingTable2 = true;
	        		}
	        		if(existingTable1 && existingTable2){
	        		var mappingTab = req.params['table1'] + "_" + req.params['table2'];
	        		var mappingTab1 = req.params['table1'] + "_" + req.params['table2'];
	        		var mappingTab2 = req.params['table2'] + "_" + req.params['table1'];
	        		var mapTableExists = false;
	        		var array= collectionNames.filter( collec => collec.name=== mappingTab1)
	        		if(array.length > 0){
	        			mapTableExists = true;
	        			mappingTab = mappingTab1;
	        		}
	        		var array2= collectionNames.filter( collec => collec.name=== mappingTab2)
	        		if(array2.length > 0){
	        			mapTableExists = true;
	        			mappingTab = mappingTab2;
	        		}
	        		 
	        		 var tab1= req.params['table1']
	        		 
	        		 var id1 = req.params['id1']
	        		 var tab2= req.params['table2']
	        		 var id2 = req.params['id2']
	        		 var body= {'_id':createUniqueId(),[tab1]: id1, [tab2] : id2};
	        		
					if(!mapTableExists)
	        		{
	        			console.log(mappingTab);
	        			var itemSchema = new mongoose.Schema({}, { strict: false,  _id: false, collection: mappingTab });
						var Item = mongoose.model(mappingTab, itemSchema);
						var item = new Item(body);
						item.save();
						res.send(item);
	        		}
	        		else{
	        			console.log("collection Exists");
	        			console.log(JSON.stringify(body));
	        			const collection = dbo.collection(mappingTab);
	        			collection.insert(body);
	        			res.send(body);
	        			return;
	        		}}
	        		else res.send(null);
	    		});
			});
		}

	function deleteMultiTableRecord(req,res){

		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
	      	if (err) {
	        	console.log(err);
	       		return;
	   		}
  		var mappingTab = req.params['table1'] + "_" + req.params['table2'];
	    var mappingTab1 = req.params['table1'] + "_" + req.params['table2'];
	    var mappingTab2 = req.params['table2'] + "_" + req.params['table1'];
	    var mapTableExists = false;
	   	var array= collectionNames.filter( collec => collec.name=== mappingTab1)
	    if(array.length > 0){
	        mapTableExists = true;
	        mappingTab = mappingTab1;
	    }
	    var array2= collectionNames.filter( collec => collec.name=== mappingTab2)
	    if(array2.length > 0){
	        mapTableExists = true;
	        mappingTab = mappingTab2;
	    }
	    if(mapTableExists)
	    {
	    	var query = {[req.params['table1']]: req.params['id1'],[req.params['table2']]: req.params['id2'] };
	    	dbo.collection(mappingTab).deleteOne(query, function(err, obj) {
	    				if (err) throw err;
	    				console.log("1 document deleted");  
	    				res.send("document deleted")			
	    				db.close();
	  					});

	    }
	    else
	    {
	    	res.send(null);
	    }
	});
  	});

	}

	function deleteMultiTableFirstTable(req,res){

		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db(useDb);
  		dbo.listCollections().toArray(function (err, collectionNames) {
	      	if (err) {
	        	console.log(err);
	       		return;
	   		}
  		var mappingTab = req.params['table1'] + "_" + req.params['table2'];
	    var mappingTab1 = req.params['table1'] + "_" + req.params['table2'];
	    var mappingTab2 = req.params['table2'] + "_" + req.params['table1'];
	    var mapTableExists = false;
	   	var array= collectionNames.filter( collec => collec.name=== mappingTab1)
	    if(array.length > 0){
	        mapTableExists = true;
	        mappingTab = mappingTab1;
	    }
	    var array2= collectionNames.filter( collec => collec.name=== mappingTab2)
	    if(array2.length > 0){
	        mapTableExists = true;
	        mappingTab = mappingTab2;
	    }
	    if(mapTableExists)
	    {
	    	var query = {[req.params['table1']]: req.params['id1']};
	    	console.log(query);
	    	dbo.collection(mappingTab).deleteMany(query, function(err, obj) {
	    				if (err) throw err;
	    				  
	    				res.send("documents deleted")			
	    				db.close();
	  					});

	    }
	    else
	    {
	    	res.send(null);
	    }
	});
  	});

	}

	app.delete("/api/:table", deleteTable)
	app.delete("/api/:table/:id", deleteTableRecord)
	app.get("/api/:table/:id", findTableRecord)
	app.put("/api/:table", findByPredicates)
	app.put("/api/:table/:id", updateTableRecord)
	app.get("/api/:table", findTable)
	app.post("/api/:table", createTable);
	app.get("/api", findAllTables);
	app.post("/api/:table1/:id1/:table2/:id2", createMappingTable2)
	app.get("/api/:table1/:id/:table2", getMappingTables)
	app.delete("/api/:table1/:id1/:table2/:id2", deleteMultiTableRecord)
	app.delete("/api/:table1/:id1/:table2", deleteMultiTableFirstTable)

}