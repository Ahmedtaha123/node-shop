// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;

// let _db;

// const mongoConnect = callback => {
//     const uri = "mongodb+srv://ahmed:fmy2042019@firstone-6y7ww.mongodb.net/shop?retryWrites=true&w=majority";
//     MongoClient.connect(uri, {useUnifiedTopology: true, useNewUrlParser: true })
//         .then(client => {
//             console.log('mongo connected');
//             _db = client.db();
//             callback();
//         })
//         .catch(err => {
//             console.log('mongo err : ' + err);
//             throw err;
//         });
// };

// const getDb = () => {
//     if(_db){
//         return _db;
//     }
//     throw 'No Database found!';
// };

// exports.mongoConnect = mongoConnect;
// exports.getDb = getDb;

// const MongoClient = require('mongodb').MongoClient;
// const uri = "mongodb+srv://ahmed:<password>@firstone-6y7ww.mongodb.net/<dbname>?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
