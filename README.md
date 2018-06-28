## Preview
![image](https://i.imgur.com/oyh1lxM.gif)

## How to work with alexis
```bash
npm i alexis
```

### Login IG alexis

```javascript
let Ig = require('alexis');

/* login by pass */
let ig = new Ig();

/* Or login by session */
let ig = new Ig({ sessionID, csrfToken });
 
    
```

### Actions
```javascript

  (async() => {
    /* login */
     let x = await ig.loginByPassword({ username: 'your uname', password: 'password' })

    /* get your tl media */
      let x = ig.getTimeLineMedia();
    /* end of get */
    
    /* get MediaByUserName */
      let x = await ig.getMediaByUserName('alfathdirk', { limit: 24 });
    /* end of get */
    
    /* like media */
      ig.likeMedia('1617391803554904915');
    /* end like media */
    
    /* for comment */
      let ob = {
          id: '860417844570038475',
          code: 'vw0XiQASDLAOyz7qynA06nBTTARSd2hiesmWE0' ,
        }
      ig.commentMedia(ob, 'test');
    /* end comment */
    
    /* get story  */
      let x = await ig.story('alfathdirk')
    /* end story  */
    
    /* get media ID by url */
      let x = await ig.getMediaId('https://www.instagram.com/p/BcWb-2XA1uw/')
    /* end media  */
    //   console.log(x);
    })()

```

## Author
@alfathdirk
