import { RequestHandler } from "express";
import { validationResult } from "express-validator";

const validationResultMiddleware: RequestHandler = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
	} else {
		next();
	}
};

export default validationResultMiddleware;
