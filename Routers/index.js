const express = require('express');
const router = express.Router();
const path = require("path");

const mysql = require('mysql2/promise');
async function getConnection(){
    let connection = await mysql.createConnection(
        {
            host:'localhost',
            user:'root',
            password:'adminuser',
            database:'board',
        }
    );
    return connection;
}

router.get('/', (req, res)=>{
    // 경로 : 현재 폴더에서 한단계 상위로 갔다가  views 폴더로 이동하는 경로
    if( req.cookies.session ){
        res.redirect('/board/boardList');
    }else{
        res.sendFile( path.join(__dirname, '/..', '/views/loginForm.html') );
    }
});

router.get('/getLoginUser', async (req, res, next)=>{
    const userid = req.session[ req.cookies.session ];
    if( !req.cookies.session || !req.session[req.cookies.session] ){
        // 로그인한 사람이 없다면 쿠키와 세션을 모두 지웁니다
        delete req.session[req.cookies.session]; 
        res.clearCookie('session', req.cookies.session ,{ httpOnly : true,   path : '/'  });
        return res.json( {loginUser:'none'} );
    }
    console.log('userid', userid)
    const sql = "select * from member where userid=?";
    try{
        const connection = await getConnection();
        const [rows, fields] = await connection.query(sql, [userid]);
        if( rows.length >= 1){
            res.json( {loginUser:rows[0]} );
        }
    }catch(err){
        console.error(err);
        next(err);
    }
});

module.exports = router;