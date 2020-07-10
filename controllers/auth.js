const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const errorHandlers = require('./help-func/err-handler');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));
exports.getLogin = (req, res, next) => {    
    //const isLoggedIn = req.get('Cookie').trim().split('=')[1] === 'true';
    const errors = validationResult(req);
    res.render('auth/login', 
    {
        pageTitle: 'Login', 
        path:'/login', 
        errorMessage: req.flash('loginError'),
        errorEmail: req.flash('loginEmail'),
        errorPassword: req.flash('loginPassword'),
        validationErrors: errors.array()
    });             
};

exports.postLogin = (req, res, next) => {  
    const email = req.body.email;      
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/login', 
        {
            pageTitle: 'Login', 
            path:'/login', 
            errorMessage: errors.array()[0].msg,
            errorEmail: email,
            errorPassword: password,
            validationErrors: errors.array()
        });
    }
    User.findOne({ email: email })
        .then(user => {
            if(!user){
                return res.status(422).render('auth/login', 
                {
                    pageTitle: 'Login', 
                    path:'/login', 
                    errorMessage: 'Invalid email',
                    errorEmail: email,
                    errorPassword: password,
                    validationErrors: [{ param: 'email',}]
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if(doMatch){
                        req.session.isLoggedIn =true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/'); 
                        });
                    }
                    return res.status(422).render('auth/login', 
                    {
                        pageTitle: 'Login', 
                        path:'/login', 
                        errorMessage: 'Invalid Password',
                        errorEmail: email,
                        errorPassword: password,
                        validationErrors: [{ param: 'password',}]
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });            
        })
        .catch(err => {
            console.log(err);
            errorHandlers.errorHandlers(err, next);
        });
    //res.setHeader('Set-Cookie', 'loggedIn=true; HttpOnly');                
};

exports.getSignup = (req, res, next) => {    
    //const isLoggedIn = req.get('Cookie').trim().split('=')[1] === 'true';
    const errors = validationResult(req);
    res.render('auth/signup', 
    {
        pageTitle: 'Signup', 
        path:'/signup', 
        errorMessage: req.flash('signupError'),
        errorEmail: req.flash('signupEmail'),
        errorPassword: req.flash('signupPassword'),
        errorConfirmPassword: req.flash('signupConfirmPassword'),
        validationErrors: errors.array()
    });             
};

exports.postSignup = (req, res, next) => {  
    const email = req.body.email;      
    const password = req.body.password;          
    const confirmPassword = req.body.confirmPassword;          
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup', 
        {
            pageTitle: 'Signup', 
            path:'/signup', 
            errorMessage: errors.array()[0].msg,
            errorEmail: email,
            errorPassword: password,
            errorConfirmPassword: confirmPassword,
            validationErrors: errors.array()
        });
    } 
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: []},
        });
        return user.save();
    })
    .then(result => {
        res.redirect('/login');
        return transporter.sendMail({
            to: email,
            from: 'ahmedtaha200079@gmail.com',
            subject: 'Signup Succeeded',
            html: '<h1>You Successfully signed up!</h1>'
        })
        .catch(err => {
            console.log(err);
            errorHandlers.errorHandlers(err, next);
        });
    });  
};

exports.postLogout = (req, res, next) => {        
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');   
    });              
};

exports.getReset = (req, res, next) => {    
    res.render('auth/reset', 
    {
        pageTitle: 'Reset Password', 
        path:'/reset', 
        errorMessage: req.flash('resetError'),
        errorEmail: req.flash('resetEmail'),
    });             
};

exports.postReset = (req, res, next) => {   
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: email})
            .then(user => {
                if(!user){
                    req.flash('resetError', 'No Account with that email found.');
                    req.flash('resetEmail', email);
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: email,
                    from: 'ahmedtaha200079@gmail.com',
                    subject: 'Reset Password',
                    html: `
                        <p>You Requested a password reset</p>
                        <p>Clik this <a href="http://localhost:5000/reset/${token}">Link</a> to set a new password.</p>
                    `
                })
            })
            .catch(err => {
                console.log(err);
                errorHandlers.errorHandlers(err, next);
            });
    });
};

exports.getNewPassword = (req, res, next) => {   
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }})
        .then(user => {
            res.render('auth/new-password', 
            {
                pageTitle: 'New Password', 
                path:'/new-password', 
                userId: user._id.toString(),
                passwordToken: token,
                errorMessage: req.flash('newPasswordError'),
                errorPassword: req.flash('newPasswordPassword'),
            });  
        })
        .catch(err => {
            errorHandlers.errorHandlers(err, next);
        });               
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ 
        resetToken: passwordToken, 
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
            errorHandlers.errorHandlers(err, next);
        });
};