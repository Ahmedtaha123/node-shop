const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);
// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if(this._id){
//             dbOp = db.collection('products').updateOne({_id: this._id}, {$set: this});
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return  dbOp
//         .then(result => {
//                 //console.log(result);
//             })
//             .catch((err) => {
//                 console.log('save product err : ' + err);
//             });
//     }

//     static fettchAll() {
//         const db = getDb();
//        return db.collection('products')
//        .find()
//        .toArray() 
//        .then(products => {
//             //console.log(products);
//             return products;
//         })
//         .catch((err) => {
//             console.log('fettchAll product err : ' + err);
//         });
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//        .find({_id: new mongodb.ObjectId(prodId)})
//        .next() 
//        .then(product => {
//             //console.log(products);
//             return product;
//         })
//         .catch((err) => {
//             console.log('findById product err : ' + err);
//         });
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//        .deleteOne({_id: new mongodb.ObjectId(prodId)})
//        .then(result => {
//             //console.log(products);
//         })
//         .catch((err) => {
//             console.log('findById product err : ' + err);
//         });
//     }
// }

// module.exports = Product;
