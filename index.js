//Setting up environment
const shell = require("electron").shell;
const fs = require("fs-extra");
require.extensions['.txt'] = function (module, filename) { //making txt files require-able, thanks stackoverflow
    module.exports = fs.readFileSync(filename, 'utf8');
};
const trumpipsum = require("./res/trumpipsum.txt");
let settings,structure;
window.$ = window.jQuery = window.jquery = require("./node_modules/jquery/dist/jquery.min.js");

//alert function
const alertbox = function(text,title){
    if (title) {$("#alert_title").html(title);}else{$("#alert_title").html("Warning");}
    if (text) {$("#alert_container p").html(text);}else{$("#alert_container p").html(trumpipsum);}
    $("#alert").show();
    //maybe make level cause different behaviour
}
let alertcloselistener = $("#error_x").click(()=>{console.log("clicky clickyy");$("#alert").hide;});

//settings - check if they exist and are complete, if not, copy them from res/templates/settings.json and alert the user.
try {
    fs.accessSync("settings.json","fs.constants.W_OK"); //Write permission required for UI changes
    settings = require("./settings.json");
    let requiredsettings = ["directory"];
    for (let i=0;i<requiredsettings.length;i++){
        if (!settings.hasOwnProperty(requiredsettings[i])){
            throw new Error(`settings.json incomplete or broken. Exception thrown at property ${requiredsettings[i]}`);
        }
    }
} catch (err) {
    fs.copySync("res/templates/settings.json","settings.json");
    settings = require("./settings.json");
    alertbox("Your settings were incomplete or missing and have been reset.");
}
if (settings.directory && !settings.directory.endsWith("/")){settings.directory = settings.directory.concat("/");} 

//structure - check if it exists, else use template structure from res/templates/structure.json and alert the user.
try {
    fs.accessSync("structure.json","fs.constants.W_OK"); //Write permission required for UI changes
    structure = require("./structure.json");
} catch (err) {
    fs.copySync("res/templates/structure.json","structure.json");
    structure = require("./structure.json");
    alertbox("We could not find a structure to use for your UI. A default UI has been loaded for your reference.");
}


//check if directory is ok
try {
    fs.accessSync(settings.directory,"fs.constants.W_OK");
    console.log("Access to directory is OK");
} catch (err){
    throw Error("Cannot write to the directory specified!",err);
    alertbox("The program is unable to write to the directory specified in the settings, or the directory does not exist! Please double-check your settings.");
}


//Target dir should have three directories at all times: current, editing, legacy
//current will contain files accessible by view, Editing will have the versions that are being edited until confirmed good, Legacy has old versions thaat were overwritten through edits 
//check if dirs exist, if they don't, create them
const chkmkdir = function(dir){
    try {
        fs.accessSync(`${settings.directory}${dir}`);
        console.log(`Directory ${dir} present`);
    } catch (err) {
        console.log(`Couldn't find directory ${dir}, making one`);
        fs.mkdirSync(`${settings.directory}${dir}`);
    }
} 

chkmkdir("current");
chkmkdir("editing");
chkmkdir("legacy");

const loadViewStructure = function(name){
    let $ui_simple = $("#ui_simple");
    $ui_simple.empty();
    if (!structure.hasOwnProperty(name)){
        console.log("Error - Structure reference for "+name+" does not exist");
        return false;
    }
    let temp_data = structure[name];
    for (let i=0;i<temp_data.length;i++){
        $ui_simple.append(`<div class="button" data-btntype="${temp_data[i].type}" data-target="${temp_data[i].target}">${temp_data[i].text}</div>`);
        if (temp_data[i].hasOwnProperty("color") && temp_data[i].color){$("#ui_simple div:last-child").css("color",temp_data[i].color);}
        if (temp_data[i].hasOwnProperty("backgroundcolor") && temp_data[i].backgroundcolor){$("#ui_simple div:last-child").css("background-color",temp_data[i].backgroundcolor);}
    }
    console.log("Loaded structure "+name);
    return true;
}

loadViewStructure("main");

//button interaction
$(document).on("click",".button",function(){
    let btntype = $(this).data("btntype");
    let target = $(this).data("target");
    //opening files
    if (btntype === "file"){ 
        console.log(`Attempting to open ${settings.directory}current/${target}`);
        shell.openItem(`${settings.directory}current/${target}`);
    }
    //changing the display ("subdirectories")
    else if (btntype === "sub"){
        console.log(`Attempting to load structure ${target}`);
        loadViewStructure(target);
    }
    
});


//Watch directory for changes (use this to alert / check for modified files)
//Not completely implemented. Currently just a proof of concept.
let watcher = fs.watch(settings.directory,{recursive:true},(type,filename)=>{
    if (!filename){ //watch is inconsistent. Don't rely on it providing a filename
        console.log(`fs.watch has detected ${type}, but could not determine a filename.`);
    } else {
        console.log(`fs.watch has detected ${type} at ${filename}.`);
    }
});

//watcher.close();



//Window Interaction
const remote = require('electron').remote;
document.getElementById("button_min").addEventListener("click",(err)=>{
    remote.getCurrentWindow().minimize();
});
document.getElementById("button_max").addEventListener("click",(err)=>{
    let win = remote.getCurrentWindow();
    if (!win.isMaximized()){win.maximize();} else {win.minimize();}
});
document.getElementById("button_exit").addEventListener("click",(err)=>{
    remote.getCurrentWindow().close();
});
