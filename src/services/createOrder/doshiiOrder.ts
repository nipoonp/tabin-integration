import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IDOSHII_ORDER_FINAL_DATA,
    IDOSHII_ORDER,
    IDOSHIITEMS,
    IDOSHIITEMSOPTIONS,
    IDOSHIITEMSOPTIONSVARIANTS,
    IDOSHII_CONSUMER,
    IDOSHIITEMSTAXES,
    IDOSHII_LOG,
    IDOSHII_TRANSACTIONS,
    IINTEGRATION_MAPPINGS,
    EIntegrationType,
} from "../../model/interface";

import axios from "axios";
import { IThirdPartyIntegrationsDoshii } from "../../Model/Interface";

import { sign } from "jsonwebtoken";

let consumer: IDOSHII_CONSUMER = {
    name: "Tabin",
    email: "dev@tabin.co.nz",
    phone: "+642102828894",
    address: {
        line1: "1824B River Road,",
        line2: " Flagstaff",
        city: "Hamilton",
        state: "Hamilton",
        postalCode: "3210",
        country: "NZ",
        notes: "Tabin Kiosk",
    },
};

let log: IDOSHII_LOG = {
    employeePosRef: "100",
    employeeName: "Tabin",
    deviceRef: "Tabin Kiosk",
    deviceName: "Tabin Kiosk",
    area: "Tabin Kiosk",
};

let order: IDOSHII_ORDER = {
    externalOrderRef: "Tabin Order ID",
    manuallyProcessed: false,
    status: "pending",
    type: "",
    notes: "Tabin Note",
    requiredAt: "",
    availableEta: "",
    items: [],
    surcounts: [],
    taxes: [],
    log: log,
};

const convertedData: IDOSHII_ORDER_FINAL_DATA = {
    order: order,
    consumer: consumer,
    transactions: [],
    members: [],
};

const createOrder = (doshiiCredentials: IThirdPartyIntegrationsDoshii, convertedData: IDOSHII_ORDER_FINAL_DATA) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = sign(
                {
                    clientId: doshiiCredentials.clientId,
                    timestamp: new Date(),
                },
                doshiiCredentials.clientSecret
            );

            let headers = {
                Authorization: "Bearer" + " " + token,
                Accept: "application/json",
                "doshii-location-id": doshiiCredentials.locationId,
            };

            const result: any = await axios({
                method: "post",
                url: `${process.env.DOSHII_API_BASE_URL}partner/v3/orders`,
                headers: headers,
                data: convertedData,
            });

            if (result.data) resolve(result.data);
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
};

const convertDoshiiOrder = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT, integrationMappings: IINTEGRATION_MAPPINGS) => {
    order.externalOrderRef = tabinOrder.id;
    // order.status = tabinOrder.status; // Status is mandotory with "pending" Value
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

        items.posId = integrationMappings[`${item.id}_${EIntegrationType.DOSHII}`].externalItemId;
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

                options.posId = integrationMappings[`${innerItem.id}_${EIntegrationType.DOSHII}`].externalItemId;
                options.name = innerItem.name;

                if (innerItem.modifiers) {
                    for (let childInner of innerItem.modifiers) {
                        let variants: IDOSHIITEMSOPTIONSVARIANTS = {
                            posId: "",
                            name: "",
                            price: "",
                        };

                        variants.posId = integrationMappings[`${childInner.id}_${EIntegrationType.DOSHII}`].externalItemId;
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

    convertedData.consumer.name = tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : consumer.name;
    convertedData.consumer.email = tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : consumer.email;
    convertedData.consumer.phone = tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : consumer.phone;

    let transactions: IDOSHII_TRANSACTIONS = {
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

const createDoshiiOrder = async (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    doshiiCredentials: IThirdPartyIntegrationsDoshii,
    integrationMappings: IINTEGRATION_MAPPINGS
) => {
    const convertedData = convertDoshiiOrder(order, integrationMappings);
    const result = await createOrder(doshiiCredentials, convertedData);

    return result;
};

export { createDoshiiOrder };
