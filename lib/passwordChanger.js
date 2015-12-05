var { ActionButton } = require("sdk/ui/button/action");
var panels = require("sdk/panel"); 
var self = require("sdk/self");
const panelWidth = 150;
const panelHeight = 90;

//main button for addon
var button = ActionButton({
  id: "addonButton",
  label: "PasswortChanger",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  badge: 'ok',
  badgeColor: "#00AAAA",
  onClick: handleClick
});

// Panel as option menu for main button
var panel = panels.Panel({
  contentURL: self.data.url("optionPanel.html"),
  contentScriptFile: self.data.url("OptionPanelHandler.js"),
  onHide:handleHidePanel
});

// handle click on main button
function handleClick(state){
  panel.port.emit("startBuilding");
  panel.show({
    position: button
  });
  panel.resize(panelWidth,panelHeight); 
}

// listen for show event and send message to panel
panel.on("show", function(){
  panel.port.emit("show");
});

// listen to click on deaktivate button in panel
panel.port.on("clicked-deactivate", function () {
  console.log("yeehaa you have clicked deactivate!!");
  panel.hide();
});

function handleHidePanel(){
  //panel.port.emit("hide");
}

/* increments badge counter of button */
function incBadge(state) {
  if (isNaN(state.badge)) {
    button.badge = 0;
  }
  button.badge = button.badge + 1;
  button.badgeColor = "#FF0000";
  console.log("button '" + state.label + "' was clicked");
}

/* resets badge counter of button */
function resetBadgeCount(state){
  button.badge = 'ok';
  button.badgeColor = "#00AAAA";
}

/* decrements badge counter of button */
function decBadge(state){
  if(!isNaN(button.badge)){

  }
  else if(button.badge == 1){
      resetBadgeCount(state);
  }
  else{
    button.badge = button.badge - 1;
  }
}

