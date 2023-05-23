const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const { handleRequest } = require('../routes');

const registrationUrl = '/api/register';
const usersUrl = '/api/users';
const productsUrl = '/api/products';
const ordersUrl = '/api/orders';
const contentType = 'application/json';
chai.use(chaiHttp);

const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');

// helper function for authorization headers
const encodeCredentials = (username, password) =>
  Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');

// helper function for creating randomized test data
const generateRandomString = (len = 9) => {
  let str = '';

  do {
    str += Math.random()
      .toString(36)
      .substr(2, 9)
      .trim();
  } while (str.length < len);

  return str.substr(0, len);
};

// Get products (create copies for test isolation)
const products = require('../setup/products.json').map(product => ({ ...product }));

// Get users (create copies for test isolation)
const users = require('../setup/users.json').map(user => ({ ...user }));

const adminUser = { ...users.find(u => u.role === 'admin') };
const customerUser = { ...users.find(u => u.role === 'customer') };

const adminCredentials = encodeCredentials(adminUser.email, adminUser.password);
const customerCredentials = encodeCredentials(customerUser.email, customerUser.password);
const invalidCredentials = encodeCredentials(adminUser.email, customerUser.password);

const unknownUrls = [`/${generateRandomString(20)}.html`, `/api/${generateRandomString(20)}`];

describe('Routes', () => {
    let allUsers;
    let allProducts;
    let allOrders;

    // get randomized test user
  const getTestUser = () => {
    return {
      name: generateRandomString(),
      email: `${generateRandomString()}@email.com`,
      password: generateRandomString(10)
    };
  };
    // get randomized test product
  const getTestProduct = () => {
    return {
      name: generateRandomString(),
      price: Math.floor(Math.random() * 50000) / 100,
      image: `http://www.images.com/${generateRandomString()}.jpg`,
      description: generateRandomString(75)
    };
  };

    // get randomized test order
  const getTestOrder = () => {
    return {
      items: [
        {
          product: {
            _id: allProducts[1].id,
            name: allProducts[1].name,
            price: allProducts[1].price,
            description: allProducts[1].description
          },
          quantity: Math.floor(Math.random() * 5) + 1
        }
      ]
    };
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await User.create(users);
    allUsers = await User.find({});

    await Product.deleteMany({});
    await Product.create(products);
    allProducts = await Product.find({});

    const orders = allUsers.map(user => {
      return {
        customerId: user.id,
        items: [
          {
            product: {
              _id: allProducts[0].id,
              name: allProducts[0].name,
              price: allProducts[0].price,
              description: allProducts[0].description
            },
            quantity: Math.floor(Math.random() * 5) + 1
          }
        ]
      };
    });

    await Order.deleteMany({});
    await Order.create(orders);
    allOrders = await Order.find({});
});

    describe('handleRequest()', () => {
        describe('Viewing all users: GET /api/users', () => {

            // GET /api/users should respond with Basic Auth Challenge when Authorization header is missing
            it('should respond with Basic Auth Challenge when Authorization header is missing', async () => {
                const response = await chai
                  .request(handleRequest)
                  .get(usersUrl)
                  .set('Accept', contentType);
        
                expect(response).to.have.status(401);
                expect(response).to.have.header('www-authenticate', /basic/i);
              });
            
            // GET /api/users should respond with "403 Forbidden" when customer credentials are received
            it('should respond with "403 Forbidden" when customer credentials are received', async () => {
                const response = await chai
                  .request(handleRequest)
                  .get(usersUrl)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${customerCredentials}`);
        
                expect(response).to.have.status(403);
              });
        });

        describe('Viewing a single user: GET /api/users/{id}', () => {
            let testUser;
            let url;
            let unknownId;
      
            beforeEach(async () => {
              const tempUser = users.find(u => u.role === 'admin' && u.email !== adminUser.email);
              testUser = await User.findOne({ email: tempUser.email }).exec();
              url = `${usersUrl}/${testUser.id}`;
              unknownId = testUser.id
                .split('')
                .reverse()
                .join('');
            });

            // GET api/users/{id} should respond with status code 404 when user does not exist
            it('should respond with status code 404 when user does not exist', async () => {
                const response = await chai
                  .request(handleRequest)
                  .get(`${usersUrl}/${unknownId}`)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`);
        
                expect(response).to.have.status(404);
              });
        });
        /**
        *  Products endpoints
        */
        describe('Updating products: PUT /api/products/{id}', () => {
            const product = {
                name: 'Test Product',
                price: 45.75,
                image: 'http://www.google.com/',
                description: 'A mysterious test product'
            };
        
            let testProduct;
            let url;
            let unknownId;

            beforeEach(async () => {
                testProduct = await Product.findOne({}).exec();
                url = `${productsUrl}/${testProduct.id}`;
                unknownId = testProduct.id
                  .split('')
                  .reverse()
                  .join('');
              });

            // PUT /api/products/{id} should allow partial update of product properties
            it('should allow partial update of product properties', async () => {
                const productWithPartialData = { ...product };
                delete productWithPartialData.description;
                delete productWithPartialData.image;
        
                const response = await chai
                  .request(handleRequest)
                  .put(url)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`)
                  .send(productWithPartialData);
        
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.all.keys('_id', 'name', 'description', 'image', 'price');
                expect(response.body._id).to.equal(testProduct.id);
                expect(response.body.description).to.equal(testProduct.description);
                expect(response.body.image).to.equal(testProduct.image);
                expect(response.body.name).to.equal(product.name);
                expect(response.body.price).to.equal(product.price);
              });
        });

        describe('Deleting products: DELETE /api/products/{id}', () => {
            let testProduct;
            let url;
            let unknownId;
      
            beforeEach(async () => {
              testProduct = await Product.findOne({}).exec();
              url = `${productsUrl}/${testProduct.id}`;
              unknownId = testProduct.id
                .split('')
                .reverse()
                .join('');
            });

            // DELETE /api/products/{id} should return the deleted user
            it('should return the deleted user', async () => {
                const response = await chai
                  .request(handleRequest)
                  .delete(url)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`);
        
                const dbProducts = await Product.find({});
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                expect(dbProducts).to.be.lengthOf(allProducts.length - 1);
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.all.keys('_id', 'name', 'price', 'image', 'description');
              });
        });

        describe('Create a new product: POST /api/products', () => {

            // POST /api/products should respond with "201 Created" when product creation is successful
            it('should respond with "201 Created" when product creation is successful', async () => {
                const product = getTestProduct();
        
                const response = await chai
                  .request(handleRequest)
                  .post(productsUrl)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`)
                  .send(product);
        
                const createdProduct = await Product.findOne({
                  name: product.name,
                  image: product.image
                }).exec();
        
                const { name, price, image, description } = createdProduct;
                expect(response).to.have.status(201);
                expect(response).to.be.json;
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.all.keys('_id', 'name', 'price', 'description', 'image');
                expect(response.body).to.include({
                  _id: createdProduct.id,
                  name,
                  price,
                  image,
                  description
                });
              });
        });

        /**
        *  Orders endpoints
        */

        describe('Viewing all orders: GET /api/orders', () => {
            
            // GET /api/orders should respond with JSON when admin credentials are received
            it('should respond with JSON when admin credentials are received', async () => {
                const response = await chai
                  .request(handleRequest)
                  .get(ordersUrl)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`);
        
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                expect(response.body).to.be.an('array');
              });

            // GET /api/orders should respond with JSON when customer credentials are received
            it('should respond with JSON when customer credentials are received', async () => {
                const response = await chai
                  .request(handleRequest)
                  .get(ordersUrl)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${customerCredentials}`);
        
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                expect(response.body).to.be.an('array');
              });

        });

        describe('Viewing a single order: GET /api/orders/{id}', () => {
            let testOrder;
            let url;
            let unknownId;
      
            beforeEach(async () => {
              const customer = allUsers.find(
                user => user.email === customerUser.email && user.role === 'customer'
              );
              testOrder = await Order.findOne({ customerId: customer._id }).exec();
              url = `${ordersUrl}/${testOrder.id}`;
              unknownId = testOrder.id
                .split('')
                .reverse()
                .join('');
            });

            // GET /api/orders/{id} should respond with status code 404 when order exists but the owner is not the current customer
            it('should respond with status code 404 when order exists but the owner is not the current customer', async () => {
                const order = allOrders.find(
                  order => order.customerId.toString() !== testOrder.customerId.toString()
                );
                const response = await chai
                  .request(handleRequest)
                  .get(`${ordersUrl}/${order.id}`)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${customerCredentials}`);
        
                expect(response).to.have.status(404);
            });

        });
        
        describe('Create a new order: POST /api/orders', () => {
            // POST /api/orders should respond with "403 Forbidden" when admin credentials are received
            it('should respond with "403 Forbidden" when admin credentials are received', async () => {
                const order = getTestOrder();
                const response = await chai
                  .request(handleRequest)
                  .post(ordersUrl)
                  .set('Accept', contentType)
                  .set('Authorization', `Basic ${adminCredentials}`)
                  .send(order);
        
                expect(response).to.have.status(403);
              });

        });
    });
});