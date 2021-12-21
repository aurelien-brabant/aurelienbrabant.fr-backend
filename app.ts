import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import blogpostsRouter from './routes/blogposts';
import bodyParser from 'body-parser';

import cors from 'cors';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/*app.use((_req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*'); // TODO: only allow frontend to perform CORS
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})
*/;


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/blogposts', blogpostsRouter);

export default app;
