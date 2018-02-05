//Setting up environment
const settings = require("./settings.json");
if (!settings.directory.endsWith("/")){settings.directory = settings.directory.concat("/");} 
const shell = require("electron").shell;
const fs = require("fs");
window.$ = window.jQuery = window.jquery = require("./node_modules/jquery/dist/jquery.min.js");
const completedirtree = require("complete-directory-tree");

//get the directory tree
let files = completedirtree(settings.directory);
console.log(files);


//Opening items
$(".external").click(function(){
    let target = $(this).data("target");
    console.log(settings.directory+"/"+target);
    shell.openItem(settings.directory+"/"+target);
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
