import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IDOSHII_ORDER_FINAL_DATA,
    IDOSHII_ORDER,
    IDOSHII_ITEMS,
    IDOSHII_ITEMS_OPTIONS,
    IDOSHII_ITEMS_OPTIONS_VARIANTS,
    IDOSHII_CONSUMER,
    IDOSHII_ITEMS_TAXES,
    IDOSHII_LOG,
    IDOSHII_TRANSACTIONS,
    IINTEGRATION_MAPPINGS,
    EIntegrationType,
    IThirdPartyIntegrationsDoshii,
} from "../../model/interface";

import axios from "axios";

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
    externalOrderRef: "",
    manuallyProcessed: false,
    status: "pending",
    type: "",
    notes: "",
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
    order.requiredAt = tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt;
    order.availableEta = tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt;
    order.notes = tabinOrder.notes || "TABIN ORDER";

    for (let product of tabinOrder.products) {
        let items: IDOSHII_ITEMS = {
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
        let orderTaxes: IDOSHII_ITEMS_TAXES = {
            posId: product.id,
            name: product.name,
            amount: "15",
            type: "percentage",
            taxType: "inclusive",
            value: product.price.toString(),
        };

        items.posId = integrationMappings[`${product.id}_${EIntegrationType.DOSHII}`].externalItemId;
        items.name = product.name;
        items.quantity = product.quantity;
        items.description = product.name;
        items.unitPrice = product.price.toString();
        items.totalAfterSurcounts = product.price.toString();
        items.totalBeforeSurcounts = product.price.toString();

        if (product.category?.name) {
            let categoryName = product.category?.name;
            items.tags.push(categoryName);
        }

        if (product.modifierGroups) {
            for (let modifierGroup of product.modifierGroups) {
                let options: IDOSHII_ITEMS_OPTIONS = {
                    posId: "",
                    name: "",
                    variants: [],
                };

                options.posId = integrationMappings[`${modifierGroup.id}_${EIntegrationType.DOSHII}`].externalItemId;
                options.name = modifierGroup.name;

                if (modifierGroup.modifiers) {
                    for (let modifier of modifierGroup.modifiers) {
                        let variants: IDOSHII_ITEMS_OPTIONS_VARIANTS = {
                            posId: "",
                            name: "",
                            price: "",
                        };

                        variants.posId = integrationMappings[`${modifier.id}_${EIntegrationType.DOSHII}`].externalItemId;
                        variants.name = modifier.name;
                        variants.price = modifier.price.toString();

                        for (var i = 0; i < modifier.quantity; i++) {
                            options.variants.push(variants);
                        }
                    }
                }

                items.options.push(options);
            }
        }
        let itemTaxes: IDOSHII_ITEMS_TAXES = {
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
    const doshiiOrder = convertDoshiiOrder(order, integrationMappings);

    console.log("xxx...doshiiOrder", JSON.stringify(doshiiOrder));

    const result = await createOrder(doshiiCredentials, doshiiOrder);

    return result;
};

export { createDoshiiOrder };
