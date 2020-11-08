const cds = require('@sap/cds');
const qs = require('qs');
const axios = require('axios');
const request = require('request');
const xsenv = require('@sap/xsenv');
const jar = request.jar();
const xsuaa = xsenv.getServices({ xsuaa: { name: 'Xuaa-Instance' } }).xsuaa;
const destination = xsenv.getServices({ destination: { name: 'Destiation-Instance' } }).destination;
const destinationSecret = destination.clientid + ':' + destination.clientsecret;
const destinationCredentials = Buffer.from(destinationSecret).toString('base64');
const express = require("express");
const app = express();

module.exports = cds.service.impl(async function () {
    let destinationToken = await getAccessToken(destinationCredentials, destination);
    let url = await _getDestinationURL(destinationToken);
    let odata;
    let res = await request({
        uri: url.url + 'SEPMRA_C_PD_Product',
        method: "GET",
        jar: jar,
        headers: {
            'Accept': 'application/json',
            'Authorization': url.auth,
        },
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10,
    }, function (error, response, body) {
        console.log(error);
        if (error) {
            return res.send(error);
        }
        //console.log(body);
        odata = JSON.parse(body);
    });

let CSRFToken = await getCSRFToken(url.url, url.auth);

oData = {
      "Activation_ac":false,
      "Copy_ac":true,
      "Delete_ac":true,
      "Edit_ac":true,
      "Favorites_add_ac":true,
      "Favorites_remove_ac":true,
      "Favorites_toggle_ac":true,
      "Mycart_add_ac":true,
      "Preparation_ac":false,
      "Review_delete_ac":true,
      "Review_modify_ac":true,
      "Validation_ac":false,
      "Product_fc":7,
      "ProductDraftUUID":"00000000-0000-0000-0000-000000000000",
      "DimensionUnit":"M",
      "ProductPictureURL":"/sap/public/bc/NWDEMO_MODEL/IMAGES/no_photo.jpg",
      "Supplier":"100000032",
      "ProductBaseUnit":"EA",
      "Weight":"1.000",
      "WeightUnit":"KG",
      "OriginalLanguage":"EN",
      "AverageRatingValue":"0.00",
      "Name":"test",
      "IsActiveEntity":true,
      "ActiveProduct":"EPM-043514",
      "HasActiveEntity":false,
      "HasDraftEntity":false,
      "Product":"EPM-043514",
      "ProductCategory":"Computer System Accessories",
      "Price":"1.00",
      "Currency":"EUR",
      "Height":"1.00",
      "Width":"1.00",
      "Depth":"1.00"
}

    let resPost = await request({
        uri: url.url + "SEPMRA_C_PD_Product",
        method: "POST",
        jar: jar,
        headers: {
            'content-type': 'application/json',
            'Accept': 'application/json',
            'Authorization': url.auth,
            'X-CSRF-token': CSRFToken,
        },
        body: JSON.stringify(oData),
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10,
    }, function (error, response, body) {
        console.log(error);
        if (error) {
            return res.send(error);
        }
        console.log(body);
        let json = JSON.parse(body);
    });

});

async function getAccessToken(credentials, serviceName) {
    return new Promise(async (res, rej) => {
        var headers = {
            'Authorization': 'Basic ' + credentials,
            'content-type': 'application/x-www-form-urlencoded'
        }
        var form = {
            'client_id': serviceName.clientid,
            'grant_type': 'client_credentials'
        }
        let response = await axios({
            method: 'post',
            url: xsuaa.url + '/oauth/token',
            data: qs.stringify(form),
            headers: headers
        });
        let token = response.data.access_token;
        res(token)
    })
};

async function _getDestinationURL(token) {
    return new Promise(async (res, rej) => {
        var headers = { 'Authorization': 'Bearer ' + token };
        let response = await axios({
            method: 'get',
            url: destination.uri + '/destination-configuration/v1/subaccountDestinations/' + 'ES5_SEPMRA_PROD_MAN',
            headers: headers
        });
        var tokenAuth = response.data.User + ':' + response.data.Password;

        var auth = 'Basic ' + Buffer.from(tokenAuth).toString('base64');

        res({ url: response.data.URL, auth: auth });
    })
};

async function getCSRFToken(url, auth) {
    return new Promise(async (res, rej) => {
        request({
            uri: url,
            method: "GET",
            jar: jar,
            headers: {
                'X-CSRF-token': 'Fetch',
                'Authorization': auth,
            },
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10,
        }, function (error, response, body) {
            if (error) {
                rej(error);
            }
            res(response.headers['x-csrf-token']);
        });
    })
};