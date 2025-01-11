const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
require('dotenv').config()
const UserSchema = require('./model/userModel')


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google profile:', profile);

            let user = await UserSchema.findOne({ email: profile.emails[0].value });

            if (!user) {
                
                user = new UserSchema({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                });
                await user.save();
            }

            
            return done(null, user);
        } catch (error) {
            console.error('Error during authentication:', error);
            return done(error, null);
        }
    }
));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserSchema.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport