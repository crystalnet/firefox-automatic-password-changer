
var myFrom; 
self.on("click", function (node, data) {
    console.log("You clicked " + data);
    console.log("thats the node " + node.id);

    switch(data){
    	case "BE1": 
    		console.log("hier muss man also benutzername/email eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["BE1",node.form.id, node.type,node.id,node.name,node.form.name,node.form.action]);
    		break;
    	case "AP2": 
    		console.log("hier muss man also das aktuelle password eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["AP2",node.form.id, node.type,node.id,node.name,node.form.name,node.form.action]);
    		break;
    	case "NP3": 
    		console.log("hier muss man also neues passwort eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["NP3",node.form.id, node.type,node.id,node.name, node.form.name,node.form.action]);
    		break;
    	case "Logout": 
    		console.log("hiermit loggt man sich aus");
    		//console.log("die id des formulars ist " + node.form.id);
    		//console.log("die name des formulars ist " + node.form.name);
    		//console.log("die action ist " + node.form.action);
    		//console.log("das href ist  " + node.href);
    		if(node.hasAttribute("action")){
    			self.postMessage(["Logout",node.form.id, node.form.name,node.form.action,"",node]);
    		}
    		else if(node.hasAttribute("href")){
    			self.postMessage(["Logout","", "","",node.href,node]);
    		}
    		
    		break;
    }
});