exports.mongo = {
	uri: 'mongodb://roshow:testbase@ds031978.mongolab.com:31978/rodb',
	db: 'rodb',
	host: 'ds031978.mongolab.com',
	port: 31978,
	username: 'roshow',
	password: 'testbase'
};
exports.session = {
	secret:'rolipolizzzzz'
};
exports.google = {
	client_id: '90018158841.apps.googleusercontent.com',
	client_secret: 'CqkR9hg3oOqueskTTij1PAcW',
	redirect: 'http://murmuring-shelf-6183.herokuapp.com/googleoauth',
	redirect_local: 'http://localhost:3000/googleoauth'
};