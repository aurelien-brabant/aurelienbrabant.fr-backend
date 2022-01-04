import { RequestHandler } from "express";

const isAdministrator: RequestHandler = (req, res, next) => {
    if (req.user === undefined) {
        return res.status(400).json({ msg: 'User not logged in'});
    }

    console.log(req.user);
    
    if ((req.user as BrabantApi.UserData).role < 10) {
        return res.status(403).json({ msg: 'Not enough privileges' });
    }

    next();
    return res.status(400); // to calm down the typescript compiler
}

export default isAdministrator;