const Product = require('../models/product');
const { validationResult } = require('express-validator');
const errorHandlers = require('./help-func/err-handler');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    const errors = validationResult(req);
    res.render('admin/edit-product', 
    {
        pageTitle: 'Add Product', 
        path: "/admin/add-product",
        editing: false, 
        hasError: false, 
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;
    const userId = req.user._id;
    if(!image){
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Add Product', 
            path: "/admin/add-product",
            editing: false, 
            hasError: true, 
            errorMessage: 'Attached file is not an image.',
            validationErrors: [],
            product: {
                title: title,
                price: price,
                description: description,
            },
        });
    }
    const errors = validationResult(req);
    const imageUrl = '/' + image.path;
    if(!errors.isEmpty()){
        fileHelper.deleteFile(imageUrl);
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Add Product', 
            path: "/admin/add-product",
            editing: false, 
            hasError: true, 
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            product: {
                title: title,
                price: price,
                description: description,
            },
        });
    }    
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: userId
    });
    product.save().then(result => {
        res.redirect('/admin/products');
    }).catch(err => {
        console.log('postAddProduct error : ' + err);
        errorHandlers.errorHandlers(err, next);
    });   
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode){
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {            
            if(!product){
                return res.redirect('/');
            }
            res.render('admin/edit-product', 
            {
                pageTitle: 'Edit Product', 
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        }).catch(err => {
            console.log('getEditProduct error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });    
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImage = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        fileHelper.deleteFile(updatedImage.path);
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Edit Product', 
            path: "/admin/add-product",
            editing: true, 
            hasError: true, 
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
        });
    }
    Product.findById(prodId)
        .then(product => {
            if(product.userId.toString() !== req.user._id.toString()){
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if(updatedImage){
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = '/' + updatedImage.path;
            }            
            return product.save()
            .then(result => res.redirect('/admin/products'));
        })                
        .catch(err => {
            //console.log('postEditProduct error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });    
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'username')
        .then(products => {
            res.render('admin/products', 
            {
                prods: products, 
                pageTitle: 'Admin Products', 
                path:'/admin/products', 
            });
        })
        .catch(err => {
            console.log('getIndex error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });  
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    let imageUrl;
    Product.findById(prodId)
    .then(product => {
        if(!product){
            return next(new Error('Product not found.'));
        }
        imageUrl = product.imageUrl;
        return Product.deleteOne({_id: prodId, userId: req.user._id});
    })
        .then(() => {
            fileHelper.deleteFile(imageUrl);
            res.status(200).json({ message: 'Success'});
        })
        .catch(err => {
            res.status(500).json({ message: 'Deleting product failed.'});
        });    
};