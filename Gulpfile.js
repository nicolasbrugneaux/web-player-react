var gulp = require( 'gulp' );
var gutil = require( 'gulp-util' );
var source = require( 'vinyl-source-stream' );
var watchify = require( 'watchify' );
var browserify = require( 'browserify' );
var babelify = require( 'babelify' );
var webserver = require( 'gulp-webserver' );
var assign = require( 'object-assign' );


var bundler = watchify( browserify( './src/js/webplayer.js',
    assign( watchify.args, { debug: true } ) ) ); //add inline sourcemap
// add any other browserify options or transforms here
bundler.transform( babelify.configure(
{
    playground: true
} ) );

gulp.task( 'js', bundle ); // so you can run `gulp js` to build the file
gulp.task( 'serve', serve );
bundler.on( 'update', bundle ); // on any dep update, runs the bundler
bundler.on( 'log', gutil.log ); // output build logs to terminal

function bundle()
{
    return bundler.bundle()
        // log errors if they happen
        .on( 'error', gutil.log.bind( gutil, 'Browserify Error' ) )
        .pipe( source( 'webplayer.js' ) )
        //
        .pipe( gulp.dest( './dist/js/' ) );
}

function serve()
{
    gulp.src( '.' )
        .pipe( webserver(
        {
            livereload: true,
            open: true,
            fallback: 'index.html'
        } ) );
}
