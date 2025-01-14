const express = require('express');
const router = express.Router();
const path = require("path");
const multer = require('multer');

const mysql = require('mysql2/promise');
async function getConnection(){
    let connection = await mysql.createConnection(
        {
            host : 'localhost',
            user : 'root',
            password : 'adminuser',
            database : 'board'
        }
    );
    return connection;
}


const uploadObj = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});



router.get('/boardList', (req, res)=>{
    res.sendFile(  path.join(__dirname, '/..', '/views/boardList.html') )
});

router.get('/getBoards', async (req, res, next)=>{
    const sql = "select * from board order by num desc";
    try{
        const connection = await getConnection();
        const [rows, fields ] = await connection.query(sql);
        // rows 변수안에는 하나의 레코드가 하나의 객체 형태로 저장됩니다.
        // rows 변수는 배열변수입니다.
        // [ {num:1, writer:'scott', title:'안녕하세요', ... } , {} , {} , {} ....  ]
        res.send( rows );
    }catch(err){
        next(err);
    }
});


router.get('/boardView/:boardnum', async (req, res, next)=>{
    const sql = "update board set readcount=readcount+1 where num=?";
    req.session['boardnum'] = req.params.boardnum;
    try{
        const connection = await getConnection();
        const [result] = await connection.query(sql, [req.params.boardnum]);
        res.sendFile( path.join(__dirname, '/..', '/views/boardView.html') );
    }catch(err){ next(err);}
});


router.get('/getBoard', async (req, res, next)=>{
    const sql = 'select * from board where num=?';
    try{
        const connection = await getConnection();
        const [rows, fields] = await connection.query(sql, [ req.session.boardnum ]);
        res.send( rows[0] );
    }catch(err){ next(err); }
});


router.get('/boardWriteForm', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/boardWriteForm.html') );
});


router.post('/imageup', uploadObj.single('image'), (req, res)=>{
    res.json( 
        { 
            image:req.file.originalname, 
            savefilename:req.file.filename 
        } 
    );
});

router.post('/writeBoard', async (req, res, next)=>{
    const {userid, pass, email, title, content, image, savefilename} = req.body;
    const sql = "insert into board(userid, pass, email, title, content, image, savefilename) "
        + "values(?,?,?,?,?,?,?)";
    try{
        const connection = await getConnection();
        const [result ] = await connection.query(sql, [userid, pass, email, title, content, image, savefilename]);
        res.send('ok');
    }catch(err){next(err);}
});


router.get('/getReplys', async (req, res, next)=>{
    const boardnum = req.session.boardnum;
    try{
        const connection = await getConnection();
        const sql = "select * from reply where boardnum=? order by replynum desc";
        const [rows, fields] = await connection.query(sql, [boardnum]);
        res.send( rows );
    }catch(err){ next(err);  }
});

router.post('/insertReply', async (req, res, next)=>{
    const userid = req.session[ req.cookies.session ];
    const { boardnum, content } = req.body;
    console.log(boardnum, ' ', content );
    try{
        const connection = await getConnection();
        const sql = "insert into reply( userid, boardnum, content) values(? ,? , ?)";
        const [result] = await connection.query(sql, [userid, boardnum, content]);
        res.send('ok');
    }catch(err){ next(err ); }
});

router.delete("/deleteReply/:replynum", async (req, res, next)=>{
    try{
        const connection = await getConnection();
        const sql = "delete from reply where replynum=?";
        const [result] = await connection.query(sql, [req.params.replynum]);
        res.send('ok');
    }catch(err){next(err);}
});


router.get('/updateBoardForm' , (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/boardUdateForm.html') );
});


router.post('/updateBoard', async (req, res)=>{
    const connection = await getConnection();
    const { title, content, image, savefilename }=req.body;
    const sql = 'update board set title=?, content=?, image=?, savefilename=? where num=?';
    try{
        const [result, field] = await connection.query(sql, [title, content, image, savefilename, req.session.boardnum] );
    }catch(err){
        console.error(err);
    }
    res.send('ok');
});

router.get('/boardViewWithoutCount', async (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/boardView.html') );
});

// router.get('/deleteBoard', async (req, res, next)=>{
//     try{
//         const connection = await getConnection();
//         const sql = 'delete from board where num=?';
//         const [result] = await connection.query(sql, [req.session.boardnum]);
//         res.redirect('/board/boardList');
//     }catch(err){ next(err); }
// });

router.delete('/deleteBoard/:pass', async(req, res, next)=>{
    // 게시물을 조회해서 전송된 pass 와  게시물의  pass 비교하고, 그 결과에 맞는 처리를 해주세요
    let sql = 'select * from board where num=?';
    try{
        const connection = await getConnection();
        const [rows, field] = await connection.query(sql, [req.session.boardnum]);
        if( rows[0].pass == req.params.pass ){
            sql = 'delete from board where num=?';
            const [result] = await connection.query(sql, [req.session.boardnum]);
            res.send('ok');
        }else{
            res.send('not_ok');
        }
    }catch(err){ next(err); }
});

module.exports = router;