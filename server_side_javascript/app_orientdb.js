//express라는 모듈을 가져옴
var express = require('express');
//bodyParser라는 모듈을 가져옴. post의 받아온 데이터를 사용하기 위함.
var bodyParser = require('body-parser');
//fs라는 모듈을 가져옴. 파일을 읽고 쓴느데 사용.ㅇ
var fs = require('fs');
//multer라는 모듈을 가져옴. file을 업로드하는데 사용.
var multer = require('multer');

var OrientDB = require('orientjs');

var _storage = multer.diskStorage({
	destination: function (req, file, cb){
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb){
		cb(null, file.originalname);
	}
})

//multer라는 모듈이 함수라서 dest라는 옵션을 주면 업로드를 받을 수 있는 미들웨어를 리턴해줌.
var upload = multer({ storage: _storage });

//DB 생성
var server = OrientDB({
	host: 'localhost',
	port: 2424,
	username: 'root',
	password: 'jjde0420'
});
//어떤 DB를 쓸건지 선언
var db = server.use('o2');

//application 객체를 생성
var app = express();

//post방식의 데이터를 받아오기 위한 bodyParser 모듈 사용 준비 단계
app.use(bodyParser.urlencoded({ extended: false}));

//views_file에 있는 템플릿 엔진의 줄바꿈을 해줌
app.locals.pretty =true;

app.use('/user', express.static('uploads'));

//views_orientdb 디렉토리의 jade 템플릿 엔진을 사용하여 form을 만들것.
app.set('views','./views_orientdb');
app.set('view engine', 'jade');

app.get('/upload', function(req, res){
	res.render('upload');
});
//middleware가 콜백 함수 시행되기 전에 먼저 실행됨 파일을 가공해서 req에 포함시킴.
app.post('/upload', upload.single('userfile'), function(req, res){
	console.log(req.file);
	res.send('Uploaded : '+req.file.filename);
});

//routing을 출력
app.get('/topic/add', function(req, res){
	var sql = 'SELECT FROM topic';
	db.query(sql).then(function(topics){
	 	res.render('add',{topics:topics});
	});
});

app.post('/topic/add', function(req, res){
	var title = req.body.title;
	var description = req.body.description;
	var author = req.body.author;
	var sql = 'INSERT INTO topic (title, description, author) VALUES(:title, :description, :author)';
	db.query(sql,
		{params:{
			title:title,
			description:description,
			author:author
		}
	}).then(function(results){
		res.redirect('/topic/'+encodeURIComponent(results[0]['@rid']));
	});
})

app.get('/topic/:id/edit', function(req, res){
	var sql = 'SELECT FROM topic';
	var id = req.params.id;
	db.query(sql).then(function(topics){
		var sql = 'SELECT FROM topic WHERE @rid=:rid';
		db.query(sql, {params:{rid:id}}).then(function(topic){
			res.render('edit', {topics:topics, topic:topic[0]});
		});
	});
});

app.post('/topic/:id/edit', function(req, res){
	var sql = 'UPDATE topic SET title=:t, description=:d, author=:a WHERE @rid=:rid';
	var id = req.params.id;
	var title = req.body.title;
	var description = req.body.description;
	var author = req.body.author;
	db.query(sql,{
		params:{
			t:title,
			d:description,
			a:author,
			rid:id
		}
	}).then(function(topics){
		res.redirect('/topic/'+encodeURIComponent(id));
	});
});

app.get('/topic/:id/delete', function(req, res){
	var sql = 'SELECT FROM topic';
	var id = req.params.id;
	db.query(sql).then(function(topics){
		var sql = 'SELECT FROM topic WHERE @rid=:rid';
		db.query(sql, {params:{rid:id}}).then(function(topic){
			res.render('delete', {topics:topics, topic:topic[0]});
		});
	});
});

app.post('/topic/:id/delete', function(req, res){
	var sql = 'DELETE FROM topic WHERE @rid=:rid';
	var id = req.params.id;

	db.query(sql,{
		params:{
			rid:id
		}
	}).then(function(topics){
		res.redirect('/topic/');
	});
});

app.get(['/topic','/topic/:id'],function(req,res){
	var sql = 'SELECT FROM topic';
	db.query(sql).then(function(topics){
		var id = req.params.id;
		if(id){
			var sql = 'SELECT FROM topic WHERE @rid=:rid';
			db.query(sql, {params:{rid:id}}).then(function(topic){
				res.render('view', {topics:topics, topic:topic[0]});
			});			
		}else{
			res.render('view', {topics:topics});
		}
	});
});



/*application이 특정 port를 listen하게 할수 있고
listen 후에 function이라는 callback 함수를 실행함
*/
app.listen(3000,function(){
	console.log('Connected, 3000 port!');
})