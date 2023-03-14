import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IORDERLINE_MODIFIERS,
    IWIZBANG_ORDER,
    IWIZBANG_ORDER_CUSTOMER,
    IWIZBANG_ORDER_ORDERLINES,
} from "../../Model/Interface";

import axios from "axios";

const customer: IWIZBANG_ORDER_CUSTOMER = {
    CUSTOMERID: 1,
    NAME: "",
    SURNAME: "",
    FIRSTNAME: "",
    MIDDLENAME: "",
    TITLE: "",
    PHONENO: "",
    EMAIL: "",
    ADDRESS: {
        LINE1: "",
        LINE2: "",
        LINE3: "",
        LINE4: "",
        LINE5: "",
    },
    LOCATION: "",
    NOTES: "",
};

const convertedData: IWIZBANG_ORDER = {
    TABLENAME: "",
    LINKCODE: "",
    ACCOUNTID: null,
    EATINPICKUPDELIVERY: 2,
    CUSTOMER: customer,
    ORDERLINES: [],
    TENDER: [],
};

const createOrder = (data: IWIZBANG_ORDER) => {
    let requestedData = JSON.stringify(data);
    let username = "admin";
    let password = "admin";
    let encodedBase64Token = Buffer.from(`${username}:${password}`).toString("base64");
    let authorization = `Basic ${encodedBase64Token}`;
    authorization = authorization.replace(/[\r\n]+/gm, "");

    let headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorization,
    };
    return new Promise(function (resolve, reject) {
        axios({
            method: "post",
            url: "http://203.109.232.106:5585/wizbang/restapi/service/order",
            headers: headers,
            data: requestedData,
        })
            .then(async (result: any) => {
                if (result.data) {
                    resolve(result.data);
                }
            })
            .catch((err: any) => {
                console.log(err);
                reject(err);
            });
    });
};

const convertWizBangOrder = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    // console.log("item", tabinOrder);
    convertedData.TABLENAME = tabinOrder.table ? tabinOrder.table : "";
    convertedData.ACCOUNTID = 1;
    convertedData.EATINPICKUPDELIVERY = tabinOrder.type == "DINEIN" ? 1 : tabinOrder.type == "TAKEAWAY" ? 2 : 3;
    convertedData.CUSTOMER.FIRSTNAME = tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "";
    convertedData.CUSTOMER.EMAIL = tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "";
    convertedData.CUSTOMER.PHONENO = tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "";
    for (let item of tabinOrder.products) {
        let orderlines: IWIZBANG_ORDER_ORDERLINES = {
            ITEMID: null,
            QTY: null,
            USEUNITPRICE: false,
            ITEMABBREV: "",
            UNITPRICE: null,
            SALESTAXPERCENT: null,
            ORDERLINEMODIFIERS: [],
        };
        orderlines.QTY = item.quantity ? item.quantity : null;
        orderlines.USEUNITPRICE = true;
        orderlines.ITEMABBREV = item.name ? item.name : "";
        orderlines.UNITPRICE = item.price ? item.price : null;
        orderlines.ITEMID = 1;
        if (item.modifierGroups) {
            for (let innerItem of item.modifierGroups) {
                if (innerItem.modifiers) {
                    for (let childInner of innerItem.modifiers) {
                        let modifiers: IORDERLINE_MODIFIERS = {
                            MODIFIER: "",
                            USEMODPRICE: false,
                            MODPRICE: 0,
                        };
                        modifiers.MODIFIER = childInner.name ? childInner.name : "";
                        modifiers.MODPRICE = childInner.price ? childInner.price : 0;
                        modifiers.USEMODPRICE = true;
                        orderlines.ORDERLINEMODIFIERS.push(modifiers);
                    }
                }
            }
        }
        convertedData.ORDERLINES.push(orderlines);
    }

    return convertedData;
};

const createWizBangOrder = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const convertedData = convertWizBangOrder(order);
    const result = await createOrder(convertedData);

    return result;
};

export { createWizBangOrder };
