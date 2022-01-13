import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import passport from "passport";
import jwtStrategy from "./auth/JwtStrategy";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import usersAdminRouter from "./routes/admin_users";
import projectsRouter from "./routes/projects";
import projectsAdminRouter from "./routes/admin_projects";
import blogpostsRouter from "./routes/blogposts";
import blogpostsAdminRouter from "./routes/admin_blogposts";
import authRouter from "./routes/auth";
import contactRouter from './routes/contact';

import technologiesRouter from "./routes/technologies";
import technologiesAdminRouter from "./routes/admin_technologies";

import isAdministrator from "./middlewares/isAdministrator";

import bodyParser from "body-parser";

import cors from "cors";

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

passport.use(jwtStrategy);

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/blogposts", blogpostsRouter);
app.use("/projects", projectsRouter);
app.use("/auth", authRouter);
app.use("/technologies", technologiesRouter);
app.use("/contact", contactRouter);

app.use("/admin", [
	passport.authenticate("jwt", { session: false }),
	isAdministrator,
]);
app.use("/admin/blogposts", blogpostsAdminRouter);
app.use("/admin/users", usersAdminRouter);
app.use("/admin/technologies", technologiesAdminRouter);
app.use("/admin/projects", projectsAdminRouter);

export default app;
