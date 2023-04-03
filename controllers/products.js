const responseUtils = require('../utils/responseUtils');
const http = require('http');
/**
 * Send all products as JSON
 *
 * @param {http.ServerResponse} response response to the UI
 * @returns {object} JSON object
 */
const getAllProducts = async response => {
  // TODO: 10.2 Implement this
  const Product = await require('../models/product');
  const allProducts = await Product.find({});
  return responseUtils.sendJson(response, allProducts);
};

const addNewProduct = async (response, product) => {
  if (!product.name) {
    return responseUtils.badRequest(response, 'Name is missing');
  }
  if (!product.price || (product.price && product.price <= 0)) {
    return responseUtils.badRequest(response, 'Price is missing or invalid');
  }
  if (!product.description) {
    return responseUtils.badRequest(response, 'Description is missing');
  }
  if (!product.image) {
    return responseUtils.badRequest(response, 'Image is missing');
  }
  const Product = await require('../models/product');
  const newProduct = await new Product({
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image
  });
  await newProduct.save();
  return responseUtils.createdResource(response, newProduct);
};

const getProduct = async (response, id) => {

  const Product = await require('../models/product');
  const product = await Product.findOne({ _id: id });
  if (!product) {
    return responseUtils.notFound(response);
  }
  return responseUtils.sendJson(response, product);
};

const updateProduct = async (response, id, productData) => {
  
  if (!productData.name) {
    return responseUtils.badRequest(response, 'Name is missing');
  }
  if (!productData.price || productData.price <= 0) {
    return responseUtils.badRequest(response, 'Price is missing or invalid');
  }
  /*if (!productData.description) {
    return responseUtils.badRequest(response, 'Description is missing');
  }
  if (!productData.image) {
    return responseUtils.badRequest(response, 'Image is missing');
  }*/
  const Product = await require('../models/product');
  const currentProduct = await Product.findOne({ _id: id });
  if (!currentProduct) {
    return responseUtils.notFound(response);
  }

  else{
    currentProduct.name = productData.name;
    //currentProduct.description = productData.description;
    currentProduct.price = productData.price;
    //currentProduct.image = productData.image;
    if(productData.image){
      currentProduct.image = productData.image;
    }
    if(productData.description){
      currentProduct.description = productData.description;
    }
    await currentProduct.save();
    return responseUtils.sendJson(response, currentProduct);
  }
};

const deleteProduct = async (response, id) => {
  const Product = await require('../models/product');
  const product = await Product.findOne({ _id: id });
  if (!product) {
    return responseUtils.notFound(response);
  }
  await product.remove();
  return responseUtils.sendJson(response, product);
};

module.exports = { getAllProducts, addNewProduct, getProduct, updateProduct, deleteProduct };