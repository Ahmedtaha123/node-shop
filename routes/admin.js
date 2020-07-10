const path = require('path');
const express = require('express');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const { check } = require('express-validator');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', [
    check('title', 'invalid Title')
    .isString()
    .isLength({ min: 3})
    .trim(),
    check('price', 'invalid price').isFloat(),
    check('description', 'invalid description').isLength({ min: 5, max: 400}).trim(),

],isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post('/edit-product', [
    check('title', 'invalid Title')
    .isString()
    .isLength({ min: 3})
    .trim(),
    check('price', 'invalid price').isFloat(),
    check('description', 'invalid description').isLength({ min: 5, max: 400}).trim(),

], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);
module.exports = router;