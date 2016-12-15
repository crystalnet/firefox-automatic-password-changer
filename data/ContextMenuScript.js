/*
this is a content script for contextmenu functionalities 
it is attached to the contextmenu when a recorderobject is recording 
there are 4 events that is listened for
BE1 = if user marked a inputfield as a username input field
AP2 = if user marked a inputfield as a actual password input field
NP3 = if user marked a inputfield as a new password input field
Logout = if user marked a inputfield as a logout element input field
*/
var myFrom; 
self.on("click", function (node, data) {
    console.log("You clicked " + data);
    console.log("thats the node " + node.id);
    switch(data){
    	case "usernameOrEmail":
    		console.log("hier muss man also benutzername/email eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["usernameOrEmail",node.form.id, node.type,node.id,node.name,node.form.name,node.form.action]);
    		break;
    	case "currentPassword":
    		console.log("hier muss man also das aktuelle password eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["currentPassword",node.form.id, node.type,node.id,node.name,node.form.name,node.form.action]);
    		break;
    	case "newPassword":
    		console.log("hier muss man also neues passwort eingeben");
    		console.log("die id des formulars ist " + node.form.id);
    		console.log("die name des formulars ist " + node.form.name);
    		console.log("das feld ist vom Typ " + node.type);
    		console.log("das feld ist mit id " + node.id);
    		console.log("das feld ist mit name " + node.name);
    		console.log("die action ist " + node.form.action);
    		self.postMessage(["newPassword",node.form.id, node.type,node.id,node.name, node.form.name,node.form.action]);
    		break;
		// this case never happens, option is not even added to the content menu
		// might be needed for websites that implement logout as form submit
    	// case "Logout":
    	// 	console.log("hiermit loggt man sich aus");
    	// 	if((node.form != null) && (node.form.hasAttribute("action"))){
    	// 		self.postMessage(["Logout",node.form.id, node.form.name,node.form.action,""]);
    	// 	}
    	// 	else if(node.hasAttribute("href")){
    	// 		self.postMessage(["Logout","", "","",node.href]);
    	// 	}
         //    else if(node.tagName == "button")
    	// 	  self.postMessage(["Logout",node.id, node.name,"",""]);
    	// 	break;
    }
});