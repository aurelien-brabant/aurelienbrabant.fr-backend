import {RequestHandler} from "express";
import fetch from 'node-fetch';

const verifyURI = "https://www.google.com/recaptcha/api/siteverify";

const recaptcha2: RequestHandler = async (req, res, next) => {
   const { 'g-recaptcha-response': token } = req.body; 

   if (!token) {
       return res.status(400).json({ msg: 'recaptcha2 verification failed: no token in request body'});
   }

    const rcRes = await fetch(verifyURI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `secret=${process.env.RECAPTCHA2_SECRET}&response=${token}`
    });

    const json = await rcRes.json();

    if ((json as any).success) {
        return next();
    }

    console.log(json);

    return res.status(401).json({ msg: 'recaptcha2 verification failed: recapta2 API returned verification failure' });
}

export default recaptcha2;
