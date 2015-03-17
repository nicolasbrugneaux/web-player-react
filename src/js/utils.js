export const formatTime = ( time ) =>
{
    let _time = Math.round( time );

    let minutes = Math.floor( _time / 60 );
    let seconds = _time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
};

// http://en.wikipedia.org/wiki/Levenshtein_distance#Iterative_with_two_matrix_rows
export const levenshtein = ( str_m, str_n ) =>
{
    let str_m_len = str_m.length;
    let str_n_len = str_n.length;

    if ( str_m === str_n )
    {
        return 0;
    }

    if ( str_m_len === 0 )
    {
        return str_n_len;
    }

    if ( str_n_len === 0 )
    {
        return str_m_len;
    }

    let v0 = new Uint8Array( str_n_len + 1 );
    let v1 = new Uint8Array( str_n_len + 1 );

    // initialize v0 (the previous row of distances)
    // this row is A[0][i]: edit distance for an empty s
    // the distance is just the number of characters to delete from t
    for ( let i = 0; i < str_m_len + 1; i++ )
    {
        v0[i] = i;
    }

    for ( let i = 0; i < str_n_len; i++)
    {
        // calculate v1 (current row distances) from the previous row v0

        // first element of v1 is A[i+1][0]
        //   edit distance is delete (i+1) chars from s to match empty t
        v1[0] = i + 1;

        // use formula to fill in the rest of the row
        for ( let j = 0; j < str_n_len; j++ )
        {
            let cost = ( str_m[i] === str_n[j] ) ? 0 : 1;
            v1[j + 1] = Math.min( v1[j] + 1, v0[j + 1] + 1, v0[j] + cost );
        }

        // copy v1 (current row) to v0 (previous row) for next iteration
        for ( let j = 0; j < str_m_len + 1; j++ )
        {
            v0[j] = v1[j];
        }
    }

    return v1[str_n_len];
};


export const fuzzyMatch = ( list, query ) =>
{
    let _query = RegExp( query.replace( / /g, '' ).split('').join('.*?'), 'g' );

    return list.filter( ( song ) =>
    {
        return _query.test( song.title.toLowerCase() );
    } );
};
