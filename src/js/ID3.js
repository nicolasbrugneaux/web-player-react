import { ID3, FileAPIReader } from './vendor/ID3.js';

function getID3Data( file, done )
{
    getTags( file, ( result ) =>
    {

        result.audioTrack = file;
        result.playing = false;
        done( result );
    } );
}

function getTags( file,done )
{
    let result = {};

    ID3.loadTags( file.name, () =>
    {
        let tags = ID3.getAllTags( file.name );

        result.artist = tags.artist || 'Unknown Artist';
        result.title = tags.title || 'Unknown';
        result.album = tags.album || '';
        if ( tags.picture && tags.picture.data && tags.picture.data.length )
        {
            result.picture = tags.picture;
            getImageSource( result.picture, ( imageSource ) =>
            {
                result.picture = imageSource;
                done( result );
            } );
        }
        else {
            result.picture = null;
            done( result );
        }


    },
    {
        tags: ['artist', 'title', 'album', 'picture'],
        dataReader: FileAPIReader( file )
    } );

}

function getImageSource( image, done )
{
    let base64String = '';
    for ( let i = 0; i < image.data.length; i++ )
    {
        base64String += String.fromCharCode( image.data[i] );
    }
    done( 'data:' + image.format + ';base64,' + window.btoa( base64String ) );
}


function readFile( file,done )
{
    let reader = new FileReader();
    reader.onload = ( data ) => done( data );
    reader.readAsDataURL( file );
}

export {
    readFile,
    getImageSource,
    getTags,
    getID3Data
};
