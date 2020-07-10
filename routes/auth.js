const express = require('express');
const { check } = require('express-validator');

const authControllers = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authControllers.getLogin);
router.post('/login', [
    check('email')
    .isEmail().withMessage('Please Enter a vaild email')
    .normalizeEmail(),
    check('password', 'please enter a password with only numbers and text and at least 5 characters.')
    .isLength({ min: 5})
    .isAlphanumeric().trim(),
], authControllers.postLogin);
router.get('/signup', authControllers.getSignup);
router.post('/signup', [
    check('email')
    .isEmail().withMessage('Please Enter a vaild email')
    .custom((val, { req }) => {
        return User.findOne({ email: req.body.email})
        .then(userDoc => {
            if(userDoc){
                return Promise.reject('Email Exisist');
            }});
        }).normalizeEmail(),
    check('password', 'please enter a password with only numbers and text and at least 5 characters.')
    .isLength({ min: 5})
    .isAlphanumeric().trim(),
    check('confirmPassword').custom((val, { req }) => {
        if(val !== req.body.password){
            throw new Error('Password have to match!');
        }
        return true;
    }).trim()
], authControllers.postSignup);
router.post('/logout', authControllers.postLogout);
router.get('/reset', authControllers.getReset);
router.post('/reset', authControllers.postReset);
router.get('/reset/:token', authControllers.getNewPassword);
router.post('/new-password', authControllers.postNewPassword);
module.exports = router;