import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import passport from 'passport';
import jwtStrategy from './auth/JwtStrategy';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import blogpostsRouter from './routes/blogposts';
import blogpostsAdminRouter from './routes/admin_blogposts';
import authRouter from './routes/auth';


import isAdministrator from './middlewares/isAdministrator';

import bodyParser from 'body-parser';

import cors from 'cors';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

passport.use(jwtStrategy);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/blogposts', blogpostsRouter);
app.use('/projects', projectsRouter);
app.use('/auth', authRouter);

app.use('/admin/blogposts', [passport.authenticate('jwt', { session: false }), isAdministrator, blogpostsAdminRouter]);

export default app;
