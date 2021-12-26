import { RequestHandler } from "express";
import { validationResult } from "express-validator";

const validationResultMiddleware: RequestHandler = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		res.status(400).json({ msg: 'Could not validate request body', errors: errors.array() });
	} else {
		next();
	}
};

export default validationResultMiddleware;
