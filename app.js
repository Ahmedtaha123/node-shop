const path = require('path');
const fs = require('fs');
const https = require('https');


const express = require('express');
const session = require('express-session');
const MongodbStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 
`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@firstone-6y7ww.mongodb.net/${process.env.MONGODB_DEFUALT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongodbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png'
    || file.mimetype === 'image/jpg'
    || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else{
        cb(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    {flags: 'a'}
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
    session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store})
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res,next) => {
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if(!user){
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next();
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    if(req.user){
        res.locals.userIdd = req.user._id;
    }    
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
    return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', 
    {
        pageTitle: 'Error!',
        path : '/500', 
    });
});

mongoose.connect(MONGODB_URI,
{useUnifiedTopology: true, useNewUrlParser: true })
    .then(result => {
        console.log('mongo connected');               
        // https.createServer({ key: privateKey, cert: certificate}, app)
        // .listen(process.env.PORT || 5000);
        app.listen(process.env.PORT || 5000);
    })
    .catch(err => {
        console.log(err);
    });