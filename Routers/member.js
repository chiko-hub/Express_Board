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

// const connection = mysql.createConnection(
//     {
//         host:'localhost',
//         user:'root',
//         password:'adminuser',
//         database:'board',
//     }
// );

router.post('/login', async (req, res, next)=>{
    const { userid, pwd } = req.body;
    const sql = "select * from member where userid=?";
    try{
        const connection = await getConnection();
        const [rows, fields] = await connection.query(sql, [userid]);
        //console.log(rows);
        //console.log(fields);
        if( rows.length >= 1){
            if( rows[0].pwd == pwd ){
                const uniqueInt = Date.now();
                // 서버에 저장되는 로그인 유저정보는 아이디만 저장됩니다.
                req.session[uniqueInt] = rows[0].userid;
                res.cookie('session', uniqueInt, {httpOnly : true,path : '/'});
                res.json({msg:'ok'});
            }else{
                res.json( {msg:'비밀번호가 맞지 않습니다'} );
            }
        }else{
            res.json( {msg:'아이디가 없습니다'} );
        }
    }catch(err){
        console.error(err);
        next(err);
    }
});


router.get('/logout', (req, res)=>{
    delete req.session[req.cookies.session]; 
    res.clearCookie('session', req.cookies.session ,{ httpOnly : true,   path : '/'  });
    res.redirect('/');
});

router.get('/joinForm' , (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/joinForm.html') );
});

router.post('/idcheck', async (req, res)=>{
    const userid = req.body.userid;
    const sql = "select * from member where userid=?";
    try{
        const connection = await getConnection();
        const [rows, fields] = await connection.query(sql, [userid]);
        if( rows.length >= 1){
            res.json({id:'0'});
        }else{
            res.json( {id:'1'} );
        }
    }catch(err){
        console.error(err);
        next(err);
    }
});


router.post('/join', async (req, res)=>{
    const { userid, pwd, name, email, phone} = req.body;
    const sql = "insert into member(userid, pwd, name, email, phone) values(?,?,?,?,?)";
    try{
        const connection = await getConnection();
        const [ result ] = await connection.query(sql, [userid, pwd, name, email, phone]);
        // console.log('result ', result);
        res.json({msg:'회원가입이 완료되었습니다. 로그인하세요'});
    }catch(err){
        console.error(err);
        res.json({msg:'회원가입에 오류가 있습니다. 관리자에게 문의하세요'});
    }
});


router.get('/updateForm' , (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/updateMemberForm.html') );
});

router.post('/update' , async (req, res)=>{
    const {userid, pwd, name, phone, email } = req.body;
    const sql = "update member set pwd=?, name=?, phone=?, email=? where userid=?";
    try{
        const connection = await getConnection();
        const [result, fields] = await connection.query(sql, [pwd, name, email, phone, userid] );
        res.send('ok');
    }catch(err){
        next(err);
    }
});

router.delete('/deleteMember/:pwd', async (req, res, next)=>{
    const userid = req.session[ req.cookies.session ];
    let sql = 'select * from member where userid=?';
    try{
        const connection = await getConnection();
        const [rows, fields ] = await connection.query(sql, [userid]);
        if( rows[0].pwd == req.params.pwd ){
            sql = 'delete from member where userid=?';
            const [result ] = await connection.query(sql, [userid]);
            delete req.session[req.cookies.session]; 
            res.clearCookie('session', req.cookies.session ,{ httpOnly : true,   path : '/'  });
            res.send('ok');
        }else{
            res.send('not-ok');
        }

    }catch(err){ next(err); }
});

module.exports = router;