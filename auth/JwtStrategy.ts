import { StrategyOptions, Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { findUserById } from '../services/users';

const opts: StrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_SECRET,
};

const strat = new JwtStrategy(opts, async (payload, done) => {
	const user = await findUserById(payload.sub);

	console.log('strategy');

	if (!user) {
		return done('User could not be found for JWT authentication', false);
	}

	return done(null, user);
});

export default strat;
