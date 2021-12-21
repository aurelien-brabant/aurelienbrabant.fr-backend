declare namespace BrabantApi {
	/**
	 * API route: GET /blogposts
	 *
	 * NOTE:
	 * A BlogpostList is not an array of BlogpostData objects
	 * because the /blogposts route returns less fields
	 * for each post.
	 */

	export type BlogpostList = {
		blogpostId: number;
		title: string;
		description: string;
		authorId: number;
		releaseTs: Date;
		lastEditTs: Date;
	}[];

	/**
	 * API route: GET /blogposts/:id
	 */

	export type BlogpostData = {
		blogpostId: number;
		title: string;
		description: string;
		authorId: number;
		content: string;
		releaseTs: Date;
		lastEditTs: Date;
		coverImagePath: string;
	};

	/**
	 * API route: GET /users
	 */

	export type UserList = {
		userId: number;
		email: string;
		username: string;
		role: number;
	}[];

	/**
	 * API route: GET /users/:id
	 */

	export type UserData = {
		userId: number;
		email: string;
		username: string;
		firstname?: string;
		lastname?: string;
		role: number;
		isEmailVerified: boolean;
		isActivated: boolean;
		accountCreationTs: Date;
		lastLoginTs: Date;
	};

	export type CreateUserRet = {
		email : string,
		username: string,
		accountCreationTs: Date,
	}
}
