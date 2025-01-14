const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

const app = express();
app.set( 'port', process.env.PORT || 3000 );

// css 파일을 저장하고 읽어오기위한 폴더
app.use('/', express.static( path.join(__dirname, 'public') ));  
// 업로드되는 파일을 저장하고 읽어오기 위한 폴더
app.use('/img', express.static( path.join(__dirname, 'uploads') )); 

// 전송되어 파라미터들을  req.body 형태로 받기위한 설정
app.use(express.json());  
app.use(express.urlencoded({ extended: false })); 

dotenv.config();  // 보안이 필요한 저장내용을 저장하기위한 설정

// 쿠키와 세션
app.use( cookieParser( process.env.COOKIE_SECRET ) );
app.use(  session(
    {   
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECRET ,
        cookie: {     // session-cookie 설정    
            httpOnly: true,
            secure: false,
        },
    }
) );

const indexRouter = require('./Routers');
const memberRouter = require('./Routers/member');
const boardRouter = require('./Routers/board');

app.use('/', indexRouter);
app.use('/member', memberRouter);
app.use('/board', boardRouter);

// 위쪽에 나열된 router 들중 요청 라우터가 없어서 실행 순서가 이지점까지 오면 실행되는 에러라우터
app.use((req, res, next) => {
    res.send('404 에러입니다');  // 클라이언트 브라우저에 표시
    console.log(req.url + " 404");  // 서버 콘솔창에 표시
});

// 해당라우터에서 에러 루티에 의해  next(err) 가 호출되면 실행되는 에러라우터
app.use((err, req, res, next) => {
    res.send('서버 에러입니다');
    console.error(err);
});

app.listen(app.get('port'),()=>{console.log(app.get('port'), 'port Open'); });