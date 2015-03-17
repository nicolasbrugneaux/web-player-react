# bundle js
browserify --debug -t [ babelify --playground ] -o dist/js/webplayer.js src/js/webplayer.js;
# bundle css
# cp for now
cp src/css/style.css dist/css/style.min.css
