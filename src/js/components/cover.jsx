import React from 'react';

let styles =
{
    outerDiv:
    {
        display: 'flex',
        flex: '1 auto',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none'
    },
    innerDiv( src )
    {
        return {
            flex: 1,
            backgroundColor: '#26292C',
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            WebkitFilter: 'blur(7px)',
            margin: '-12px'
        };
    },
    img:
    {
        position: 'absolute',
        width: '500px',
        height: '500px',
        top: '50%',
        left: '50%',
        margin: '-250px auto auto -250px',
        borderRadius: '2px'
    }
};

const defaultImg = '/dist/img/default.png';

export default class Cover extends React.Component
{
    render()
    {
        let src = this.props.current ?
            this.props.current.picture : defaultImg;

        return (
            <div className='cover-art' style={styles.outerDiv}>
                <div style={styles.innerDiv( src === defaultImg ? '' : src )}/>
                <img src={src} style={styles.img}/>
            </div>
        );
    }
}
