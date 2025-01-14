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

module.exports = router;