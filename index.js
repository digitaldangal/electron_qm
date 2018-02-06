//Setting up environment
/* const completedirtree = require("complete-directory-tree");
let files = completedirtree(settings.directory); */
const settings = require("./settings.json");
if (!settings.directory.endsWith("/")){settings.directory = settings.directory.concat("/");} 
const shell = require("electron").shell;
const fs = require("fs");
window.$ = window.jQuery = window.jquery = require("./node_modules/jquery/dist/jquery.min.js");
//check if directory is ok
try {
    fs.accessSync(settings.directory,"fs.constants.W_OK");
    console.log("Access to directory is OK");
} catch (err){
    throw error("Cannot write to the directory specified!",err);
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


let structure = require("./structure.json");
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
