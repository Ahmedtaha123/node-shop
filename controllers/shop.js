const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const errorHandlers = require('./help-func/err-handler');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments()
    .then(numberProducts => {
        totalItems = numberProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
        .then(products => {
            res.render('shop/index', 
            {
                prods: products, 
                pageTitle: 'Home', 
                path:'/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log('getIndex error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });  
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments()
    .then(numberProducts => {
        totalItems = numberProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
        .then(products => {
            res.render('shop/product-list', 
            {
                prods: products, 
                pageTitle: 'All Products', 
                path:'/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log('getProducts error : ' + err);
            errorHandlers.errorHandlers(err, next);
        }); 
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product, 
                pageTitle: product.title, 
                path:'/products', 
            });
        })
        .catch(err => {
            console.log('getProduct error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products = user.cart.items;
            res.render('shop/cart', 
            {
                pageTitle: 'Your Cart', 
                path:'/cart', 
                products: products,
            }); 
        })
        .catch(err => {
            console.log('getCart error : ' + err);
            errorHandlers.errorHandlers(err, next);
        });    
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;    
    Product.findById(prodId)
        .then(product => {            
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        }).catch(err => {
            errorHandlers.errorHandlers(err, next);
        });
};

exports.postCartDeletedProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        console.log('postCartDeletedProduct error : ' + err);
        errorHandlers.errorHandlers(err, next);
    });
};

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products = user.cart.items.map(i => {
            return { quantity: i.quantity, product: {...i.productId._doc}};
        });
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user._id
            },
            products: products
        });
        return order.save();
    })
    .then(result => {  
        return req.user.clearCart();   
    })
    .then(() => {
        res.redirect('/orders');
    })
    .catch(err => {
        console.log('postOrder error : ' + err);
        errorHandlers.errorHandlers(err, next);
    });
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', 
            {
                pageTitle: 'Your Orders', 
                path:'/orders', 
                orders: orders,
            });  
        })
        .catch(err => {
            errorHandlers.errorHandlers(err, next);
        });     
};

const invoice = (req, res, next, action) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if(!order){
            return next(new Error('No Order Found.'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        // attachment
        res.setHeader('Content-Disposition', action + '; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text('Invoice', { underline: true });
        pdfDoc.text('----------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
            pdfDoc.fontSize(16).text(
                prod.product.title + ' : ' 
                + prod.quantity
                + ' x '
                + '$' + prod.product.price
            );
        });
        pdfDoc.text('---------');
        pdfDoc.fontSize(20).text('Total Price:$' + totalPrice);


        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data) => {
        //     if(err){
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        //     res.send(data);
        // });

        // const file = fs.createReadStream(invoicePath);
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        // file.pipe(res);
    })
    .catch(err => {
        errorHandlers.errorHandlers(err, next);
    });    
};

exports.getInvoice = (req, res, next) => {
    invoice(req, res, next, 'inline');
};

exports.downloadInvoice = (req, res, next) => {
    invoice(req, res, next, 'attachment');
};