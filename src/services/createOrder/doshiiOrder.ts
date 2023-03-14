import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IDOSHIORDERFINALDATA,
    IDOSHIORDER,
    IDOSHIITEMS,
    IDOSHIITEMSOPTIONS,
    IDOSHIITEMSOPTIONSVARIANTS,
    IDOSHICONSUMER,
    IDOSHIITEMSTAXES,
    IDOSHILOG,
    IDOSHITRANSACTIONS,
} from "./Interfaces";

import axios from "axios";
import { token } from "../common/generateToken";

let consumer: IDOSHICONSUMER = {
    name: "test",
    email: "test",
    phone: "test",
    address: {
        line1: "test",
        line2: "test",
        city: "test",
        state: "test",
        postalCode: "test",
        country: "AU",
        notes: "test",
    },
};

let log: IDOSHILOG = {
    employeePosRef: "11",
    employeeName: "Nitish",
    deviceRef: "11",
    deviceName: "a1",
    area: "main",
};

let order: IDOSHIORDER = {
    externalOrderRef: "",
    manuallyProcessed: false,
    status: "pending",
    type: "",
    notes: "order 1",
    requiredAt: "",
    availableEta: "",
    items: [],
    surcounts: [],
    taxes: [],
    log: log,
};

const convertedData: IDOSHIORDERFINALDATA = {
    order: order,
    consumer: consumer,
    transactions: [],
    members: [],
};

const createOrder = (convertedData: IDOSHIORDERFINALDATA) => {
    let headers = {
        Authorization: "Bearer" + " " + token,
        Accept: "application/json",
        "doshii-location-id": "kMMgKnGbE",
    };
    return new Promise(function (resolve, reject) {
        axios({
            method: "post",
            url: "https://sandbox.doshii.co/partner/v3/orders",
            headers: headers,
            data: convertedData,
        })
            .then(async (result: any) => {
                if (result.data) {
                    console.log("result Data", result.data);
                    // resolve(result.data);
                }
            })
            .catch((err: any) => {
                console.log(err);
                reject(err);
            });
    });
};

const convertDoshiiOrder = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    order.externalOrderRef = tabinOrder.id;
    // order.status = tabinOrder.status;
    order.type = tabinOrder.type == "TAKEAWAY" ? "pickup" : "dinein";
    order.requiredAt = tabinOrder.placedAt ? tabinOrder.placedAt : "";
    order.availableEta = tabinOrder.completedAt ? tabinOrder.completedAt : "";
    for (let item of tabinOrder.products) {
        let items: IDOSHIITEMS = {
            posId: "",
            name: "",
            quantity: 0,
            description: "",
            unitPrice: "",
            totalBeforeSurcounts: "",
            totalAfterSurcounts: "",
            tags: [],
            type: "single",
            // includedItems: [],
            surcounts: [],
            taxes: [],
            options: [],
        };
        let orderTaxes: IDOSHIITEMSTAXES = {
            posId: item.id,
            name: item.name,
            amount: "15",
            type: "percentage",
            taxType: "inclusive",
            value: item.price.toString(),
        };
        items.posId = item.id;
        items.name = item.name;
        items.quantity = item.quantity;
        items.description = item.name;
        items.unitPrice = item.price.toString();
        items.totalAfterSurcounts = item.price.toString();
        items.totalBeforeSurcounts = item.price.toString();
        if (item.category?.name) {
            let categoryName = item.category?.name;
            items.tags.push(categoryName);
        }
        if (item.modifierGroups) {
            for (let innerItem of item.modifierGroups) {
                let options: IDOSHIITEMSOPTIONS = {
                    posId: "",
                    name: "",
                    variants: [],
                };
                options.posId = innerItem.id;
                options.name = innerItem.name;
                if (innerItem.modifiers) {
                    for (let childInner of innerItem.modifiers) {
                        let variants: IDOSHIITEMSOPTIONSVARIANTS = {
                            posId: "",
                            name: "",
                            price: "",
                        };
                        variants.posId = childInner.id;
                        variants.name = childInner.name;
                        variants.price = childInner.price.toString();
                        options.variants.push(variants);
                    }
                }
                items.options.push(options);
            }
        }
        let itemTaxes: IDOSHIITEMSTAXES = {
            posId: items.posId,
            name: items.name,
            amount: "15",
            type: "percentage",
            taxType: "inclusive",
            value: items.unitPrice,
        };
        items.taxes.push(itemTaxes);
        order.items.push(items);
        order.taxes.push(orderTaxes);
    }
    // convertedData.consumer.name = tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "test";
    // convertedData.consumer.email = tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "test";
    // convertedData.consumer.phone = tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "test";
    let transactions: IDOSHITRANSACTIONS = {
        amount: tabinOrder.payments && tabinOrder.payments.length > 0 ? tabinOrder.payments[0].amount : 0,
        reference: "",
        invoice: "",
        linkedTrxId: "11",
        method:
            tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.cash > 0
                ? "cash"
                : tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.eftpos > 0
                ? "eftpos"
                : "other",
        tip: 0,
        prepaid: true,
        surcounts: [],
    };
    convertedData.transactions.push(transactions);
    return convertedData;
};

const createDoshiiOrder = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const convertedData = convertDoshiiOrder(order);
    const result = await createOrder(convertedData);

    return result;
};

export { createDoshiiOrder };
