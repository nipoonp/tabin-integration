import {
    EIntegrationType,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IINTEGRATION_MAPPINGS,
    IORDERLINE_MODIFIERS,
    IThirdPartyIntegrationsWizBang,
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

const createOrder = (wizBangCredentials: IThirdPartyIntegrationsWizBang, data: IWIZBANG_ORDER) => {
    let requestedData = JSON.stringify(data);
    let username = wizBangCredentials.username;
    let password = wizBangCredentials.password;
    let encodedBase64Token = Buffer.from(`${username}:${password}`).toString("base64");
    let authorization = `Basic ${encodedBase64Token}`;
    authorization = authorization.replace(/[\r\n]+/gm, "");

    let headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorization,
    };

    return new Promise(async (resolve, reject) => {
        try {
            const result: any = await axios({
                method: "post",
                url: `${wizBangCredentials.storeApiUrl}wizbang/restapi/service/order`,
                headers: headers,
                data: requestedData,
            });

            if (result.data) resolve(result.data);
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
};

const convertWizBangOrder = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT, integrationMappings: IINTEGRATION_MAPPINGS) => {
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

        orderlines.ITEMID = parseInt(integrationMappings[`${item.id}_${EIntegrationType.WIZBANG}`].externalItemId);
        orderlines.QTY = item.quantity ? item.quantity : null;
        orderlines.USEUNITPRICE = true;
        orderlines.ITEMABBREV = item.name ? item.name : "";
        orderlines.UNITPRICE = item.price ? item.price : null;

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

const createWizBangOrder = async (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    wizBangCredentials: IThirdPartyIntegrationsWizBang,
    integrationMappings: IINTEGRATION_MAPPINGS
) => {
    const convertedData = convertWizBangOrder(order, integrationMappings);
    const result = await createOrder(wizBangCredentials, convertedData);

    return result;
};

export { createWizBangOrder };
