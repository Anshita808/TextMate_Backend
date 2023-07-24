const { UserModel } = require("../models/user.model");
require("dotenv").config();
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
passport.serializeUser((user, done) => {
	// console.log(user);
	done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
	const user = await UserModel.findOne({ email: email });
	done(null, user);
});
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:8080/auth/google/callback",
			passReqToCallback: true,
		},

		async (request, accessToken, refreshToken, profile, done) => {
			//Register user here
			// console.log(request);
			done(null, profile);

			const cUser = await UserModel.findOne({ email: profile.email });
			// console.log("current user :", cUser);
			const hashedPassword = bcrypt.hashSync(profile.id, 5);
			if (!cUser) {
				const newUser = {
					email: profile.email,
					name: `${profile.name.givenName} ${profile.name.familyName}`,
					password: hashedPassword,
				};

				const data = new UserModel(newUser);

				await data.save();

				return done(null, newUser);
			} else {
				request.body = cUser;
			}
		}
	)
);

const googleAuthentication = async (req, res) => {
	// Successful authentication, redirect home.

	const user = req.user;
	//   console.log(user)
	const getUser = await UserModel.findOne({ email: user.email });
	// console.log(getUser);
	const forLocal = {
		name: getUser.name,
		email: getUser.email,
		id: getUser._id,
	};
	// console.log(getUser);
	const Accesstoken = jwt.sign(
		{ userID: getUser._id },
		process.env.SESSION_SECRET
	);

	// res.cookie("token", Accesstoken);
	res.cookie("token", Accesstoken);

	const frontendURL =
		"http://127.0.0.1:5502/TEXTMATE/Frontend/pages/payment.html";
	res.send(`
		<a href="${frontendURL}?token=${
		user.id
	}" id="myid" style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #222222; margin: 0; padding: 0; overflow: scroll;">
		<img style="width:100%;" src="https://cdn.dribbble.com/users/1787505/screenshots/7300251/media/a351d9e0236c03a539181b95faced9e0.gif" alt="https://i.pinimg.com/originals/c7/e1/b7/c7e1b7b5753737039e1bdbda578132b8.gif">
		</a>
		<script>
			const userInfo = ${JSON.stringify(forLocal)}
			let a = document.getElementById('myid')
			console.log(userInfo)
			localStorage.setItem("userInfo", userInfo)
				
				
                setTimeout(()=>{
                    a.click()
                },2000)

                console.log(a)
				
            </script>
    `);
};

module.exports = { passport, googleAuthentication };
