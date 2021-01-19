const http = require('http');
const url = require('url');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const handlers = {};
const database = {};
let db;

database.create = (airport, callback) => {
    db.collection('airports').insertOne(airport, (err, result) => {
        if(!err && result) {
            callback(null, result);

        } else {
            callback(err);
        }


    });

};

database.read = (airportId, callback) => {

    const id = new ObjectID(airportId);
    db.collection('airports').findOne({ _id: id}, (err, result) => {
        if(!err && result) {
            callback(null, result);

        } else {
            callback(err);
        }


    });
};

database.update = (airportId, airport, callback) => {


    const id = new ObjectID(airportId);
    db.collection('airports').findOneAndUpdate({ _id: id }, airport, {returnOriginal: false }, (err, result) => {
        if(!err && result) {
            callback(null, result);

        } else {
            callback(err);
        }


    });

};

database.delete = (airportId, callback) => {

    const id = new ObjectID(airportId);
    db.collection('airports').findOneAndDelete({ _id: id}, (err, result) => {
        if(!err && result) {
            callback(null, result);

        } else {
            callback(err);
        }


    });

};

handlers.airports = (parsedReq, res) => {

    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if(acceptedMethods.includes(parsedReq.method)) {
        handlers._airports[parsedReq.method](parsedReq, res);
    } else {
        res.writeHead(400);
        res.end('Not an accepted method...');
    }
};

handlers._airports = {};

handlers._airports.get = (parsedReq, res) => {
    const airportId = parsedReq.queryStringObject.id;
    database.read(airportId, (err, result) => {
        if(!err && result) {
            res.end(JSON.stringify(result));
        } else {
            res.end(err);
        }
    });
};

handlers._airports.post = (parsedReq, res) => {
    
    const airport = JSON.parse(parsedReq.body) ;

    database.create(airport, (err, result) => {
        if(!err && result) {
            res.end(JSON.stringify(result.ops[0]));
        } else {
            res.end(err);
        }
    });
};

handlers._airports.put = (parsedReq, res) => {
    const airport = JSON.parse(parsedReq.body) ;
    const airportId = parsedReq.queryStringObject.id;

    database.update(airportId, airport, (err, result) => {
        if(!err && result) {
            res.end(JSON.stringify(result.value));
        } else {
            res.end(err);
        }
    });
    
};

handlers._airports.delete = (parsedReq, res) => {
    const airportId = parsedReq.queryStringObject.id;
    database.delete(airportId, (err, result) => {
        if(!err && result) {
            res.end(JSON.stringify(result.value));
        } else {
            res.end(err);
        }
    });

    
};

handlers.notFound = (parsedReq, res) => {
    res.writeHead(404);
    res.end('Route does not exist...');
};

const router = {
    'airports' : handlers.airports
};

const server = http.createServer((req, res) => {

    const parsedReq = {};

    parsedReq.parsedUrl = url.parse(req.url, true);
    parsedReq.path = parsedReq.parsedUrl.pathname;
    parsedReq.trimmedPath = parsedReq.path.replace(/^\/+|\/+$/g, '');
    parsedReq.method = req.method.toLowerCase();
    parsedReq.headers = req.headers;
    parsedReq.queryStringObject = parsedReq.parsedUrl.query;

    let body = [];

    req.on('data', (chunk) => {
        body.push(chunk);
    });

    req.on('end', () => {
        body = Buffer.concat(body).toString();
        parsedReq.body = body;
        

        const routedHandler = typeof(router[parsedReq.trimmedPath]) !== 'undefined' ? router[parsedReq.trimmedPath] : handlers.notFound;
        routedHandler(parsedReq, res);
    });

    
});

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    if(err){
        return console.log('Could not connect to MongoDB Server\n', err.message);

    };
    console.log('Connected to database...');
    db = client.db('node_airports');



});





server.listen(3000, () => console.log('Listening on port 3000...'));
